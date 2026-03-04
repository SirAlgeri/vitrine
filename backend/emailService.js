import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

const sesClient = new SESClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const statusMessages = {
  pending: { title: 'Pedido Recebido com Sucesso!', message: 'Obrigado por sua compra! Seu pedido foi recebido e será processado em breve. Você receberá atualizações por email.', label: 'Aguardando Pagamento' },
  paid: { title: 'Pagamento Confirmado', message: 'Seu pagamento foi confirmado! Estamos preparando seu pedido para envio.', label: 'Pago' },
  processing: { title: 'Pedido em Preparação', message: 'Seu pedido está sendo preparado para envio.', label: 'Preparando Envio' },
  shipped: { title: 'Pedido Enviado', message: 'Seu pedido foi enviado e está a caminho!', label: 'Enviado' },
  delivered: { title: 'Pedido Entregue', message: 'Seu pedido foi entregue. Obrigado pela preferência!', label: 'Entregue' },
  cancelled: { title: 'Pedido Cancelado', message: 'Seu pedido foi cancelado.', label: 'Cancelado' },
};

function getEmailTemplate(customerName, orderId, status, orderDetails, colors = {}) {
  const statusInfo = statusMessages[status] || { title: 'Atualização do Pedido', message: 'Status do pedido atualizado.', label: 'Atualizado' };
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const primaryColor = colors.primary || '#11998e';
  const secondaryColor = colors.secondary || '#38ef7d';
  const storeName = colors.storeName || 'Loja';
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${statusInfo.title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <tr>
            <td style="background: ${primaryColor}; padding: 40px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">${statusInfo.title}</h1>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 40px 30px;">
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Olá <strong>${customerName}</strong>,
              </p>
              
              <p style="color: #666666; font-size: 15px; line-height: 1.6; margin: 0 0 30px;">
                ${statusInfo.message}
              </p>
              
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 6px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 10px; color: #666666; font-size: 14px;">
                      <strong style="color: #333333;">Número do Pedido:</strong> #${orderId}
                    </p>
                    <p style="margin: 0 0 10px; color: #666666; font-size: 14px;">
                      <strong style="color: #333333;">Status:</strong> 
                      <span style="background-color: ${primaryColor}; color: #ffffff; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold;">
                        ${statusInfo.label}
                      </span>
                    </p>
                    ${orderDetails.tracking_code ? `
                    <p style="margin: 0 0 10px; color: #666666; font-size: 14px;">
                      <strong style="color: #333333;">Código de Rastreio:</strong> 
                      <span style="background-color: #fff3cd; color: #856404; padding: 4px 8px; border-radius: 4px; font-family: monospace; font-size: 13px;">
                        ${orderDetails.tracking_code}
                      </span>
                    </p>
                    ` : ''}
                    ${orderDetails.delivery_deadline ? `
                    <p style="margin: 0; color: #666666; font-size: 14px;">
                      <strong style="color: #333333;">Previsão de Entrega:</strong> ${new Date(orderDetails.delivery_deadline).toLocaleDateString('pt-BR')}
                    </p>
                    ` : ''}
                  </td>
                </tr>
              </table>
              
              ${orderDetails && orderDetails.items ? `
              <h3 style="color: #333333; font-size: 18px; margin: 0 0 15px;">Resumo do Pedido</h3>
              <table width="100%" cellpadding="0" cellspacing="0" style="border-top: 2px solid #e0e0e0; margin-bottom: 20px;">
                ${orderDetails.items.map(item => `
                <tr>
                  <td style="padding: 15px 0; border-bottom: 1px solid #f0f0f0;">
                    <p style="margin: 0; color: #333333; font-size: 14px; font-weight: bold;">${item.product_name}</p>
                    <p style="margin: 5px 0 0; color: #666666; font-size: 13px;">Quantidade: ${item.quantity} × ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.product_price)}</p>
                  </td>
                  <td align="right" style="padding: 15px 0; border-bottom: 1px solid #f0f0f0;">
                    <p style="margin: 0; color: #333333; font-size: 14px; font-weight: bold;">
                      ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.subtotal)}
                    </p>
                  </td>
                </tr>
                `).join('')}
                <tr>
                  <td style="padding: 15px 0;">
                    <p style="margin: 0; color: #333333; font-size: 16px; font-weight: bold;">Total</p>
                  </td>
                  <td align="right" style="padding: 15px 0;">
                    <p style="margin: 0; color: #667eea; font-size: 18px; font-weight: bold;">
                      ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(orderDetails.total)}
                    </p>
                  </td>
                </tr>
              </table>
              ` : ''}
              
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${frontendUrl}/order/${orderId}" style="background: ${primaryColor}; color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 6px; font-size: 16px; font-weight: bold; display: inline-block;">
                      Ver Detalhes do Pedido
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="color: #999999; font-size: 13px; line-height: 1.6; margin: 30px 0 0; text-align: center;">
                Se você tiver alguma dúvida, entre em contato conosco.
              </p>
            </td>
          </tr>
          
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0; color: #999999; font-size: 12px;">
                © ${new Date().getFullYear()} ${storeName}. Todos os direitos reservados.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export async function sendEmail(to, subject, htmlBody) {
  const params = {
    Source: process.env.EMAIL_FROM,
    Destination: {
      ToAddresses: [to],
    },
    Message: {
      Subject: {
        Data: subject,
        Charset: 'UTF-8',
      },
      Body: {
        Html: {
          Data: htmlBody,
          Charset: 'UTF-8',
        },
      },
    },
  };

  try {
    const command = new SendEmailCommand(params);
    const response = await sesClient.send(command);
    console.log('✅ Email enviado:', response.MessageId);
    return { success: true, messageId: response.MessageId };
  } catch (error) {
    console.error('❌ Erro ao enviar email:', error);
    return { success: false, error: error.message };
  }
}

export async function sendOrderStatusEmail(order, newStatus, config = {}) {
  if (!order.customer_email) {
    console.warn('⚠️ Pedido sem email do cliente:', order.id);
    return { success: false, error: 'No customer email' };
  }

  const statusInfo = statusMessages[newStatus] || statusMessages.pending;
  const subject = `${statusInfo.title} - Pedido #${order.id}`;
  
  const colors = {
    primary: config.primary_color || '#11998e',
    secondary: config.secondary_color || '#38ef7d',
    storeName: config.store_name || 'Loja'
  };
  
  const htmlBody = getEmailTemplate(
    order.customer_name,
    order.id,
    newStatus,
    order,
    colors
  );

  return await sendEmail(order.customer_email, subject, htmlBody);
}

export async function sendVerificationEmail(email, code, config = {}) {
  const storeName = config.store_name || 'VitrinePro';
  const primaryColor = config.primary_color || '#3b82f6';
  
  const subject = `Código de Verificação - ${storeName}`;
  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="background: ${primaryColor}; padding: 40px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Verificação de Email</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px; text-align: center;">
              <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                Use o código abaixo para verificar seu email:
              </p>
              <div style="background: #f8f9fa; border: 2px dashed ${primaryColor}; border-radius: 8px; padding: 20px; margin: 0 0 30px;">
                <p style="margin: 0; color: ${primaryColor}; font-size: 36px; font-weight: bold; letter-spacing: 8px; font-family: monospace;">
                  ${code}
                </p>
              </div>
              <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 0;">
                Este código expira em <strong>10 minutos</strong>.<br>
                Se você não solicitou este código, ignore este email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0; color: #999999; font-size: 12px;">
                © ${new Date().getFullYear()} ${storeName}. Todos os direitos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  return await sendEmail(email, subject, htmlBody);
}
