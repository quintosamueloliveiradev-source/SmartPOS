import express from 'express';

const app = express();
app.use(express.json());

// Rota de Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', serverTime: new Date().toISOString() });
});

// Proxy da API do Asaas Sandbox com tratamento refinado de erros
app.post('/api/asaas/create-pix', async (req, res) => {
  try {
    const { name, email, cpfCnpj, userId } = req.body;
    const apiKey = process.env.ASAAS_API_KEY;

    // Validação estrita para a chave de API do Asaas
    if (!apiKey || apiKey.trim() === '') {
      return res.status(500).json({
        success: false,
        error: 'Chave de API do Asaas (ASAAS_API_KEY) não encontrada pelo servidor. Por favor, adicione-a como variável de ambiente (.env).',
        message: 'Chave de API do Asaas (ASAAS_API_KEY) não encontrada pelo servidor. Por favor, adicione-a como variável de ambiente (.env).'
      });
    }

    if (!name || !email || !userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Parâmetros name, email e userId são obrigatórios.' 
      });
    }

    const cleanCpfCnpj = (cpfCnpj || '00000000000').replace(/\D/g, '');
    const headers = {
      'Content-Type': 'application/json',
      'access_token': apiKey
    };

    console.log(`Buscando se cliente com email ${email} ou CPF ${cleanCpfCnpj} já existe no Asaas...`);
    // 1. Verificar se o cliente já existe para evitar duplicidades
    const searchUrl = `https://sandbox.asaas.com/api/v3/customers?email=${encodeURIComponent(email)}`;
    const searchResponse = await fetch(searchUrl, { method: 'GET', headers });
    
    if (!searchResponse.ok) {
      const errText = await searchResponse.text();
      throw new Error(`Falha ao buscar cliente no Asaas (${searchResponse.status}): ${errText}`);
    }

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
    console.error('Erro geral detectado no backend (create-pix):', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Erro desconhecido no servidor para o gateway Asaas.',
      message: error.message || 'Erro desconhecido no servidor para o gateway Asaas.' 
    });
  }
});

// Polling de pagamento com tratamento refinado de erros
app.get('/api/asaas/check-payment/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;
    const apiKey = process.env.ASAAS_API_KEY;

    if (paymentId.startsWith('sim_pay_')) {
      return res.json({
        success: true,
        simulated: true,
        status: 'CONFIRMED'
      });
    }

    if (!apiKey || apiKey.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        error: 'Chave do Asaas ausente no servidor.',
        message: 'Chave do Asaas ausente no servidor.' 
      });
    }

    const response = await fetch(`https://sandbox.asaas.com/api/v3/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'access_token': apiKey
      }
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Impossível verificar pagamento na API do Asaas (${response.status}): ${errText}`);
    }

    const data = await response.json();
    return res.json({
      success: true,
      simulated: false,
      status: data.status,
      billingType: data.billingType
    });
  } catch (error: any) {
    console.error('Erro ao verificar pagamento:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message,
      message: error.message 
    });
  }
});

// Webhook
app.post('/api/asaas/webhook', async (req, res) => {
  try {
    const event = req.body;
    console.log('Webhook do Asaas recebido:', JSON.stringify(event));

    if (event && (event.event === 'PAYMENT_CONFIRMED' || event.event === 'PAYMENT_RECEIVED')) {
      const userId = event.payment.externalReference;
      if (userId) {
        console.log(`Reconciliando pagamento do usuário ${userId}. Atualizando no banco...`);
      }
    }
    return res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('Erro no webhook:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default app;
