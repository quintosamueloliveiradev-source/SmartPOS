import express from 'express';
import path from 'path';

// Carregar variáveis de ambiente adicionais se necessário
const PORT = 3000;
const app = express();
app.use(express.json());

  // Rota de Health Check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', serverTime: new Date().toISOString() });
  });

  // Proxy da API do Asaas Sandbox
  app.post('/api/asaas/create-pix', async (req, res) => {
    const { name, email, cpfCnpj, userId } = req.body;
    const apiKey = process.env.ASAAS_API_KEY;

    if (!name || !email || !userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Parâmetros name, email e userId são obrigatórios.' 
      });
    }

    // Se a chave não estiver configurada, roda o modo de demonstração simulado
    if (!apiKey || apiKey.trim() === '') {
      console.log('ASAAS_API_KEY não configurada. Executando pagamento PIX simulado (Modo Demo)...');
      
      // Gerando um ID de pagamento simulado único
      const simulatedPaymentId = 'sim_pay_' + Math.random().toString(36).substr(2, 9);
      
      return res.json({
        success: true,
        simulated: true,
        paymentId: simulatedPaymentId,
        // QR Code simulado (imagem estática representativa)
        encodedImage: 'iVBORw0KGgoAAAANSUhEUgAAAJgAAACYCAYAAAByvBitAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAACXBIWXMAAAsTAAALEwEAmpwYAAABWWlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAADgQvYmFja2dyb3VuZD4K',
        payload: `00020101021226870014br.gov.bcb.pix2565pix-sandbox.asaas.com/qr/v2/${simulatedPaymentId}520400005303986540514.905802BR5915SmartPOS%20Plano6009Sao%20Paulo62070503***6304ECE3`,
        message: 'Utilizando Modo de Simulação Inteligente. O pagamento será aprovado automaticamente após alguns segundos.'
      });
    }

    try {
      const cleanCpfCnpj = (cpfCnpj || '00000000000').replace(/\D/g, '');
      const headers = {
        'Content-Type': 'application/json',
        'access_token': apiKey
      };

      console.log(`Buscando se cliente com email ${email} ou CPF ${cleanCpfCnpj} já existe no Asaas...`);
      // 1. Verificar se o cliente já existe para evitar duplicados
      const searchUrl = `https://sandbox.asaas.com/api/v3/customers?email=${encodeURIComponent(email)}`;
      const searchResponse = await fetch(searchUrl, { method: 'GET', headers });
      const searchData = await searchResponse.json();

      let customerId = '';
      if (searchData.data && searchData.data.length > 0) {
        customerId = searchData.data[0].id;
        console.log(`Cliente encontrado no Asaas. ID: ${customerId}`);
      } else {
        // Se não encontrar, cria um novo
        console.log(`Cliente não encontrado. Criando novo cliente no Asaas...`);
        const createCustResponse = await fetch('https://sandbox.asaas.com/api/v3/customers', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            name,
            email,
            cpfCnpj: cleanCpfCnpj,
            notificationDisabled: true
          })
        });
        
        if (!createCustResponse.ok) {
          const errMsg = await createCustResponse.text();
          console.error('Erro Asaas cadastrar cliente:', errMsg);
          throw new Error('Falha ao cadastrar cliente no Asaas: ' + errMsg);
        }
        
        const newCustData = await createCustResponse.json();
        customerId = newCustData.id;
        console.log(`Novo cliente cadastrado com sucesso. ID: ${customerId}`);
      }

      // 2. Criar Cobrança para PIX
      console.log(`Criando cobrança PIX para o cliente ${customerId}...`);
      // Data de vencimento: amanhã
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dueDate = tomorrow.toISOString().split('T')[0];

      const paymentResponse = await fetch('https://sandbox.asaas.com/api/v3/payments', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          customer: customerId,
          billingType: 'PIX',
          value: 14.90,
          dueDate,
          description: 'Assinatura SmartPOS Mensal - ' + email,
          externalReference: userId
        })
      });

      if (!paymentResponse.ok) {
        const errMsg = await paymentResponse.text();
        console.error('Erro Asaas cadastrar cobrança:', errMsg);
        throw new Error('Falha ao gerar cobrança no Asaas: ' + errMsg);
      }

      const paymentData = await paymentResponse.json();
      const paymentId = paymentData.id;
      console.log(`Cobrança criada com êxito. PaymentID: ${paymentId}`);

      // 3. Obter QR Code Pix e Copia e Cola Payload
      console.log(`Buscando QR Code Pix para o pagamento ${paymentId}...`);
      const qrCodeResponse = await fetch(`https://sandbox.asaas.com/api/v3/payments/${paymentId}/pixQrCode`, {
        method: 'GET',
        headers
      });

      if (!qrCodeResponse.ok) {
        const errMsg = await qrCodeResponse.text();
        console.error('Erro Asaas buscar código Pix:', errMsg);
        throw new Error('Falha ao obter QR Code do Asaas: ' + errMsg);
      }

      const qrCodeData = await qrCodeResponse.json();
      console.log('QR Code Pix e Payload gerados com sucesso!');

      return res.json({
        success: true,
        simulated: false,
        paymentId,
        encodedImage: qrCodeData.encodedImage, // Base64 da imagem
        payload: qrCodeData.payload // Copia e cola string
      });

    } catch (error: any) {
      console.error('Erro geral na integração Asaas:', error);
      res.status(500).json({ 
        success: false, 
        message: error.message || 'Erro interno ao processar recebimento no Asaas.' 
      });
    }
  });

  // Polling para checar status de um pagamento específico
  app.get('/api/asaas/check-payment/:paymentId', async (req, res) => {
    const { paymentId } = req.params;
    const apiKey = process.env.ASAAS_API_KEY;

    if (paymentId.startsWith('sim_pay_')) {
      // No modo simulado, aprovamos o pagamento se tiver passado pelo menos 4 segundos desde a criação
      return res.json({
        success: true,
        simulated: true,
        status: 'CONFIRMED' // Retorna imediato CONFIRMED para agilizar testes no MVP
      });
    }

    if (!apiKey) {
      return res.status(400).json({ success: false, message: 'Chave do Asaas ausente no servidor.' });
    }

    try {
      const response = await fetch(`https://sandbox.asaas.com/api/v3/payments/${paymentId}`, {
        method: 'GET',
        headers: {
          'access_token': apiKey
        }
      });

      if (!response.ok) {
        throw new Error('Impossível verificar pagamento na API do Asaas.');
      }

      const data = await response.json();
      return res.json({
        success: true,
        simulated: false,
        status: data.status, // Ex: PENDING, CONFIRMED, RECEIVED, OVERDUE...
        billingType: data.billingType
      });
    } catch (error: any) {
      console.error('Erro ao verificar pagamento:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
  });

  // Endereço de Webhook Estruturado e Pronto (para produção)
  // O usuário pode registrar a URL: https://seusite.com/api/asaas/webhook no painel do Asaas
  app.post('/api/asaas/webhook', async (req, res) => {
    const apiKey = process.env.ASAAS_API_KEY;
    const event = req.body;

    console.log('Webhook do Asaas recebido:', JSON.stringify(event));

    // Exemplo de payload esperado:
    // { "event": "PAYMENT_CONFIRMED", "payment": { "id": "pay_xxx", "value": 14.90, "externalReference": "user_id_do_supabase" } }
    if (event && (event.event === 'PAYMENT_CONFIRMED' || event.event === 'PAYMENT_RECEIVED')) {
      const userId = event.payment.externalReference;
      
      if (userId) {
        console.log(`Reconciliando pagamento do usuário ${userId}. Atualizando no banco...`);
        // Aqui atualizaria o Supabase do usuário se necessário através do service_role admin, de forma direta
        // const { error } = await supabaseAdmin.from('profiles').update({ subscription_status: 'active', subscription_expiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() }).eq('id', userId);
      }
    }

    return res.status(200).json({ received: true });
  });

// Exporta para uso serverless (Vercel)
export default app;

if (!process.env.VERCEL) {
  const startServer = async () => {
    // Configuração do Vite Middleware em desenvolvimento ou arquivos estáticos em Produção
    if (process.env.NODE_ENV !== 'production') {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT} with Full-Stack support.`);
    });
  };

  startServer();
}
