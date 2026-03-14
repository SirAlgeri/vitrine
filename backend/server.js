import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';
import https from 'https';
import http from 'http';
import { pool } from './db.js';
import bcrypt from 'bcrypt';
import { MercadoPagoConfig, Payment, Preference } from 'mercadopago';
import { 
  PaymentStatus, 
  OrderStatus, 
  mapMercadoPagoStatus, 
  updateOrderStatus,
  updateOrderStatusManual 
} from './statusManager.js';
import { sendOrderStatusEmail, sendVerificationEmail } from './smtpEmailService.js';
import { tenantMiddleware } from './middleware/tenant.js';
import { authenticateAdmin, generateToken } from './middleware/auth.js';
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { uploadMiddleware, uploadToS3, deleteFromS3 } from './s3Upload.js';

dotenv.config();

const mercadopago = new MercadoPagoConfig({ 
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN 
});

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Desabilitar CSP para não quebrar o frontend
  crossOriginEmbedderPolicy: false
}));

app.use(cookieParser());

// CORS configurado
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'];
app.use(cors({
  origin: (origin, callback) => {
    // Permitir requisições sem origin (mobile apps, Postman, etc)
    if (!origin) return callback(null, true);
    
    // Verificar se a origin está na lista ou é um subdomínio permitido
    const isAllowed = allowedOrigins.some(allowed => {
      if (allowed.includes('*')) {
        const pattern = allowed.replace('*.', '');
        return origin.includes(pattern);
      }
      return origin === allowed;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));

// Rate limiters
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5,
  message: { error: 'Muitas tentativas de login. Tente novamente em 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 100,
  message: { error: 'Muitas requisições. Tente novamente em 1 minuto.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Aplicar rate limiter geral
app.use('/api/', apiLimiter);

// Tenant middleware
app.use((req, res, next) => {
  if (req.path.startsWith('/api/admin/tenants')) {
    return next();
  }
  return tenantMiddleware(req, res, next);
});
// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// ========== CONFIG ==========
app.get('/api/config', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM config WHERE tenant_id = $1 LIMIT 1', [req.tenant.id]);
    const config = result.rows[0] || {};
    
    // Remover dados sensíveis/internos
    delete config.id;
    delete config.tenant_id;
    delete config.created_at;
    delete config.updated_at;
    delete config.markup_percentage;
    delete config.cep_origem;
    delete config.smtp_host;
    delete config.smtp_port;
    delete config.smtp_user;
    delete config.smtp_pass;
    delete config.smtp_from;
    delete config.smtp_from_name;
    delete config.smtp_secure;
    
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========== TENANT ==========
app.get('/api/tenant/current', async (req, res) => {
  try {
    res.json(req.tenant);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/config', authenticateAdmin, [
  body('store_name').optional().trim().isLength({ min: 1, max: 100 }),
  body('whatsapp_number').optional().matches(/^\d{10,15}$/),
  body('primary_color').optional().matches(/^#[0-9A-Fa-f]{6}$/),
  body('secondary_color').optional().matches(/^#[0-9A-Fa-f]{6}$/),
  body('markup_percentage').optional().isFloat({ min: 0, max: 100 }),
  body('cep_origem').optional().matches(/^\d{8}$/)
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      store_name, primary_color, secondary_color, whatsapp_number, logo_url, 
      enable_online_checkout, enable_whatsapp_checkout, payment_methods, 
      markup_percentage, cep_origem, enable_pickup, pickup_address,
      smtp_host, smtp_port, smtp_secure, smtp_user, smtp_pass, smtp_from, smtp_from_name,
      background_color, card_color, surface_color, text_primary_color, text_secondary_color,
      border_color, button_primary_color, button_primary_hover_color, 
      button_secondary_color, button_secondary_hover_color
    } = req.body;
    
    // Construir query dinamicamente baseado nos campos enviados
    const updates = [];
    const values = [];
    let paramCount = 1;
    
    if (store_name !== undefined) {
      updates.push(`store_name = $${paramCount++}`);
      values.push(store_name);
    }
    if (primary_color !== undefined) {
      updates.push(`primary_color = $${paramCount++}`);
      values.push(primary_color);
    }
    if (secondary_color !== undefined) {
      updates.push(`secondary_color = $${paramCount++}`);
      values.push(secondary_color);
    }
    if (whatsapp_number !== undefined) {
      updates.push(`whatsapp_number = $${paramCount++}`);
      values.push(whatsapp_number);
    }
    if (logo_url !== undefined) {
      updates.push(`logo_url = $${paramCount++}`);
      values.push(logo_url);
    }
    if (enable_online_checkout !== undefined) {
      updates.push(`enable_online_checkout = $${paramCount++}`);
      values.push(enable_online_checkout);
    }
    if (enable_whatsapp_checkout !== undefined) {
      updates.push(`enable_whatsapp_checkout = $${paramCount++}`);
      values.push(enable_whatsapp_checkout);
    }
    if (payment_methods !== undefined) {
      updates.push(`payment_methods = $${paramCount++}`);
      values.push(JSON.stringify(payment_methods));
    }
    if (markup_percentage !== undefined) {
      const markup = Number(markup_percentage);
      if (markup < 0 || markup > 100) {
        return res.status(400).json({ error: 'Margem deve estar entre 0% e 100%' });
      }
      updates.push(`markup_percentage = $${paramCount++}`);
      values.push(markup);
    }
    if (cep_origem !== undefined) {
      const cleanCep = String(cep_origem).replace(/\D/g, '');
      if (cleanCep.length !== 8) {
        return res.status(400).json({ error: 'CEP deve ter 8 dígitos' });
      }
      updates.push(`cep_origem = $${paramCount++}`);
      values.push(cleanCep);
    }
    if (enable_pickup !== undefined) {
      updates.push(`enable_pickup = $${paramCount++}`);
      values.push(enable_pickup);
    }
    if (pickup_address !== undefined) {
      updates.push(`pickup_address = $${paramCount++}`);
      values.push(pickup_address);
    }
    
    // Campos SMTP
    if (smtp_host !== undefined) {
      updates.push(`smtp_host = $${paramCount++}`);
      values.push(smtp_host);
    }
    if (smtp_port !== undefined) {
      updates.push(`smtp_port = $${paramCount++}`);
      values.push(smtp_port);
    }
    if (smtp_secure !== undefined) {
      updates.push(`smtp_secure = $${paramCount++}`);
      values.push(smtp_secure);
    }
    if (smtp_user !== undefined) {
      updates.push(`smtp_user = $${paramCount++}`);
      values.push(smtp_user);
    }
    if (smtp_pass !== undefined) {
      updates.push(`smtp_pass = $${paramCount++}`);
      values.push(smtp_pass);
    }
    if (smtp_from !== undefined) {
      updates.push(`smtp_from = $${paramCount++}`);
      values.push(smtp_from);
    }
    if (smtp_from_name !== undefined) {
      updates.push(`smtp_from_name = $${paramCount++}`);
      values.push(smtp_from_name);
    }
    
    // Campos de cores personalizadas
    if (background_color !== undefined) {
      updates.push(`background_color = $${paramCount++}`);
      values.push(background_color);
    }
    if (card_color !== undefined) {
      updates.push(`card_color = $${paramCount++}`);
      values.push(card_color);
    }
    if (surface_color !== undefined) {
      updates.push(`surface_color = $${paramCount++}`);
      values.push(surface_color);
    }
    if (text_primary_color !== undefined) {
      updates.push(`text_primary_color = $${paramCount++}`);
      values.push(text_primary_color);
    }
    if (text_secondary_color !== undefined) {
      updates.push(`text_secondary_color = $${paramCount++}`);
      values.push(text_secondary_color);
    }
    if (border_color !== undefined) {
      updates.push(`border_color = $${paramCount++}`);
      values.push(border_color);
    }
    if (button_primary_color !== undefined) {
      updates.push(`button_primary_color = $${paramCount++}`);
      values.push(button_primary_color);
    }
    if (button_primary_hover_color !== undefined) {
      updates.push(`button_primary_hover_color = $${paramCount++}`);
      values.push(button_primary_hover_color);
    }
    if (button_secondary_color !== undefined) {
      updates.push(`button_secondary_color = $${paramCount++}`);
      values.push(button_secondary_color);
    }
    if (button_secondary_hover_color !== undefined) {
      updates.push(`button_secondary_hover_color = $${paramCount++}`);
      values.push(button_secondary_hover_color);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }
    
    values.push(req.tenant.id);
    const result = await pool.query(
      `UPDATE config SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE tenant_id = $${paramCount} RETURNING *`,
      values
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========== FRETE ==========
app.post('/api/frete/calcular', async (req, res) => {
  try {
    const { cepOrigem, cepDestino, peso, comprimento, altura, largura } = req.body;
    
    const freteUrl = process.env.FRETE_SERVICE_URL || 'http://localhost:5001/calcular';
    
    const response = await fetch(freteUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cepOrigem,
        cepDestino,
        peso: peso || 0.3,
        comprimento: comprimento || 16,
        altura: altura || 2,
        largura: largura || 11
      })
    });

    if (!response.ok) {
      throw new Error('Erro ao calcular frete');
    }

    const resultado = await response.json();
    res.json(resultado);
  } catch (err) {
    console.error('Erro ao calcular frete:', err);
    res.status(500).json({ error: err.message });
  }
});

// ========== AUTH ==========
app.post('/api/auth/login', loginLimiter, [
  body('username').trim().isLength({ min: 1, max: 50 }),
  body('password').isLength({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Dados inválidos' });
    }

    const { username, password } = req.body;
    
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1 AND tenant_id = $2', 
      [username, req.tenant.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    
    if (!valid) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const token = generateToken(user);

    res.json({ 
      success: true, 
      token,
      username: user.username, 
      tenant_id: user.tenant_id 
    });
  } catch (err) {
    console.error('Erro no login:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ========== CUSTOMER AUTH ==========

// Gerar e enviar código de verificação
app.post('/api/customers/send-verification', async (req, res) => {
  try {
    const { email } = req.body;
    
    // Verificar se email já está cadastrado
    const existing = await pool.query('SELECT id FROM customers WHERE email = $1 AND tenant_id = $2', [email, req.tenant.id]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }
    
    // Gerar código de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos
    
    // Salvar código no banco
    await pool.query(
      'INSERT INTO email_verifications (email, code, expires_at, tenant_id) VALUES ($1, $2, $3, $4)',
      [email, code, expiresAt, req.tenant.id]
    );
    
    // Buscar config para personalizar email
    const configResult = await pool.query('SELECT * FROM config WHERE tenant_id = $1 LIMIT 1', [req.tenant.id]);
    const config = configResult.rows[0] || {};
    
    // Enviar email
    const emailResult = await sendVerificationEmail(email, code, config);
    
    if (!emailResult.success) {
      return res.status(500).json({ error: 'Erro ao enviar email' });
    }
    
    res.json({ success: true, message: 'Código enviado para o email' });
  } catch (err) {
    console.error('Erro ao enviar verificação:', err);
    res.status(500).json({ error: err.message });
  }
});

// Verificar código
app.post('/api/customers/verify-code', async (req, res) => {
  try {
    const { email, code } = req.body;
    
    const result = await pool.query(
      `SELECT * FROM email_verifications 
       WHERE email = $1 AND code = $2 AND verified = FALSE AND expires_at > NOW() AND tenant_id = $3
       ORDER BY created_at DESC LIMIT 1`,
      [email, code, req.tenant.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Código inválido ou expirado' });
    }
    
    // Marcar como verificado
    await pool.query(
      'UPDATE email_verifications SET verified = TRUE WHERE id = $1',
      [result.rows[0].id]
    );
    
    res.json({ success: true, message: 'Email verificado com sucesso' });
  } catch (err) {
    console.error('Erro ao verificar código:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/customers/register', async (req, res) => {
  try {
    const { nome_completo, email, senha, telefone, aceita_marketing, email_verified } = req.body;
    
    // Verificar se email foi verificado
    if (!email_verified) {
      return res.status(400).json({ error: 'Email não verificado' });
    }
    
    const existing = await pool.query('SELECT id FROM customers WHERE email = $1 AND tenant_id = $2', [email, req.tenant.id]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }
    
    const id = crypto.randomUUID();
    const senha_hash = await bcrypt.hash(senha, 10);
    
    const result = await pool.query(
      `INSERT INTO customers (id, nome_completo, email, senha_hash, telefone, aceita_marketing, email_verified, tenant_id)
       VALUES ($1, $2, $3, $4, $5, $6, TRUE, $7) RETURNING id, nome_completo, email, telefone, aceita_marketing, status, criado_em, email_verified`,
      [id, nome_completo, email, senha_hash, telefone, aceita_marketing || false, req.tenant.id]
    );
    
    res.status(201).json({ customer: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/customers/login', async (req, res) => {
  try {
    const { email, senha } = req.body;
    
    const result = await pool.query('SELECT * FROM customers WHERE email = $1 AND deletado_em IS NULL AND tenant_id = $2', [email, req.tenant.id]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }
    
    const customer = result.rows[0];
    
    if (customer.status === 'bloqueado') {
      return res.status(403).json({ error: 'Conta bloqueada. Entre em contato com o suporte.' });
    }
    
    if (customer.status === 'inativo') {
      return res.status(403).json({ error: 'Conta inativa' });
    }
    
    const valid = await bcrypt.compare(senha, customer.senha_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }
    
    // Update last login
    await pool.query('UPDATE customers SET ultimo_login_em = CURRENT_TIMESTAMP WHERE id = $1 AND tenant_id = $2', [customer.id, req.tenant.id]);
    
    delete customer.senha_hash;
    res.json({ customer });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========== CUSTOMERS ==========
app.get('/api/customers', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, nome_completo, email, telefone, cpf, cep, endereco, numero, complemento, bairro, cidade, estado FROM customers WHERE deletado_em IS NULL ORDER BY nome_completo'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/customers', async (req, res) => {
  try {
    const { nome_completo, telefone, cpf, email, cep, endereco, numero, complemento, bairro, cidade, estado } = req.body;
    
    const result = await pool.query(
      `INSERT INTO customers (id, nome_completo, telefone, cpf, email, cep, endereco, numero, complemento, bairro, cidade, estado, status, senha_hash, tenant_id)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'ativo', '', $12)
       RETURNING id, nome_completo, email, telefone, cpf, cep, endereco, numero, complemento, bairro, cidade, estado`,
      [nome_completo, telefone || '', cpf || null, email || null, cep || null, endereco || null, numero || null, complemento || null, bairro || null, cidade || null, estado || null, req.tenant.id]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/customers/me/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, nome_completo, email, telefone, cpf, cep, endereco, numero, complemento, bairro, cidade, estado, aceita_marketing, status, criado_em, ultimo_login_em FROM customers WHERE id = $1 AND deletado_em IS NULL',
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/customers/:id', async (req, res) => {
  try {
    const { nome_completo, telefone, cpf, cep, endereco, numero, complemento, bairro, cidade, estado, aceita_marketing } = req.body;
    
    const result = await pool.query(
      `UPDATE customers SET nome_completo = $1, telefone = $2, cpf = $3, cep = $4, endereco = $5, numero = $6, complemento = $7, bairro = $8, cidade = $9, estado = $10, aceita_marketing = $11
       WHERE id = $12 AND deletado_em IS NULL AND tenant_id = $13
       RETURNING id, nome_completo, email, telefone, cpf, cep, endereco, numero, complemento, bairro, cidade, estado, aceita_marketing, status, criado_em, ultimo_login_em`,
      [nome_completo, telefone, cpf, cep, endereco, numero, complemento, bairro, cidade, estado, aceita_marketing, req.params.id, req.tenant.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/customers/:id/password', async (req, res) => {
  try {
    const { senha_atual, senha_nova } = req.body;
    
    const result = await pool.query('SELECT senha_hash FROM customers WHERE id = $1 AND deletado_em IS NULL AND tenant_id = $2', [req.params.id, req.tenant.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }
    
    const valid = await bcrypt.compare(senha_atual, result.rows[0].senha_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Senha atual incorreta' });
    }
    
    const senha_hash = await bcrypt.hash(senha_nova, 10);
    await pool.query('UPDATE customers SET senha_hash = $1 WHERE id = $2 AND tenant_id = $3', [senha_hash, req.params.id, req.tenant.id]);
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/customers/:id', async (req, res) => {
  try {
    await pool.query('UPDATE customers SET deletado_em = CURRENT_TIMESTAMP, status = $1 WHERE id = $2 AND tenant_id = $3', ['inativo', req.params.id, req.tenant.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/customers/:id/orders', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM orders WHERE customer_id = $1 ORDER BY created_at DESC',
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========== CUSTOMER ADDRESSES ==========
app.get('/api/customers/:id/addresses', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM customer_addresses WHERE customer_id = $1 ORDER BY is_default DESC, criado_em DESC',
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/customers/:id/addresses', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { nome_endereco, cep, rua, numero, complemento, bairro, cidade, estado, is_default } = req.body;
    const id = crypto.randomUUID();
    
    // If setting as default, unset other defaults
    if (is_default) {
      await client.query(
        'UPDATE customer_addresses SET is_default = false WHERE customer_id = $1 AND tenant_id = $2',
        [req.params.id, req.tenant.id]
      );
    }
    
    const result = await client.query(
      `INSERT INTO customer_addresses (id, customer_id, nome_endereco, cep, rua, numero, complemento, bairro, cidade, estado, is_default, tenant_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [id, req.params.id, nome_endereco, cep, rua, numero, complemento, bairro, cidade, estado, is_default || false, req.tenant.id]
    );
    
    await client.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

app.put('/api/addresses/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { nome_endereco, cep, rua, numero, complemento, bairro, cidade, estado, is_default, customer_id } = req.body;
    
    if (is_default && customer_id) {
      await client.query(
        'UPDATE customer_addresses SET is_default = false WHERE customer_id = $1',
        [customer_id]
      );
    }
    
    const result = await client.query(
      `UPDATE customer_addresses SET nome_endereco = $1, cep = $2, rua = $3, numero = $4, complemento = $5, bairro = $6, cidade = $7, estado = $8, is_default = $9
       WHERE id = $10 RETURNING *`,
      [nome_endereco, cep, rua, numero, complemento, bairro, cidade, estado, is_default, req.params.id]
    );
    
    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

app.delete('/api/addresses/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM customer_addresses WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========== PRODUCTS ==========
app.get('/api/products', async (req, res) => {
  const client = await pool.connect();
  try {
    const productsResult = await client.query('SELECT * FROM products WHERE tenant_id = $1 ORDER BY created_at DESC', [req.tenant.id]);
    const products = productsResult.rows;
    
    // Load custom fields and images for each product
    for (const product of products) {
      const fieldsResult = await client.query(
        'SELECT field_id, value FROM product_fields WHERE product_id = $1 AND tenant_id = $2',
        [product.id, req.tenant.id]
      );
      product.fields = {};
      fieldsResult.rows.forEach(row => {
        product.fields[row.field_id] = row.value;
      });
      
      // Load images
      const imagesResult = await client.query(
        'SELECT image FROM product_images WHERE product_id = $1 AND tenant_id = $2 ORDER BY image_order',
        [product.id, req.tenant.id]
      );
      product.images = imagesResult.rows.map(row => row.image);
      
      // Remover dados sensíveis/desnecessários
      delete product.created_at;
      delete product.updated_at;
      delete product.tenant_id;
    }
    
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

app.get('/api/products/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM products WHERE id = $1 AND tenant_id = $2', [req.params.id, req.tenant.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    
    const product = result.rows[0];
    const fieldsResult = await client.query(
      'SELECT field_id, value FROM product_fields WHERE product_id = $1 AND tenant_id = $2',
      [product.id, req.tenant.id]
    );
    product.fields = {};
    fieldsResult.rows.forEach(row => {
      product.fields[row.field_id] = row.value;
    });
    
    // Load images
    const imagesResult = await client.query(
      'SELECT image FROM product_images WHERE product_id = $1 AND tenant_id = $2 ORDER BY image_order',
      [product.id, req.tenant.id]
      [product.id]
    );
    product.images = imagesResult.rows.map(row => row.image);
    
    // Remover dados sensíveis/desnecessários
    delete product.created_at;
    delete product.updated_at;
    delete product.tenant_id;
    
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Upload de imagens para S3
app.post('/api/upload-images', authenticateAdmin, uploadMiddleware, async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Nenhuma imagem enviada' });
    }
    const urls = await Promise.all(
      req.files.map(file => uploadToS3(file.buffer, file.mimetype))
    );
    res.json({ urls });
  } catch (err) {
    console.error('Erro no upload:', err);
    res.status(500).json({ error: 'Erro ao fazer upload das imagens' });
  }
});

app.post('/api/products', authenticateAdmin, [
  body('name').trim().isLength({ min: 1, max: 200 }),
  body('price').isFloat({ min: 0 }),
  body('stock_quantity').optional().isInt({ min: 0 })
], async (req, res) => {
  const client = await pool.connect();
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    await client.query('BEGIN');
    
    const { id, name, price, description, image, images, stock_quantity, fields } = req.body;
    const result = await client.query(
      'INSERT INTO products (id, name, price, description, image, stock_quantity, tenant_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [id, name, price, description, image, stock_quantity || 1, req.tenant.id]
    );
    
    // Save multiple images
    if (images && Array.isArray(images)) {
      for (let i = 0; i < Math.min(images.length, 10); i++) {
        await client.query(
          'INSERT INTO product_images (product_id, image, image_order, tenant_id) VALUES ($1, $2, $3, $4)',
          [id, images[i], i, req.tenant.id]
        );
      }
    }
    
    // Save custom fields
    if (fields) {
      for (const [fieldId, value] of Object.entries(fields)) {
        if (value) {
          await client.query(
            'INSERT INTO product_fields (product_id, field_id, value, tenant_id) VALUES ($1, $2, $3, $4)',
            [id, fieldId, value, req.tenant.id]
          );
        }
      }
    }
    
    await client.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Erro ao criar produto:', err);
    res.status(500).json({ error: 'Erro ao criar produto' });
  } finally {
    client.release();
  }
});

app.put('/api/products/:id', authenticateAdmin, [
  body('name').trim().isLength({ min: 1, max: 200 }),
  body('price').isFloat({ min: 0 }),
  body('stock_quantity').optional().isInt({ min: 0 })
], async (req, res) => {
  const client = await pool.connect();
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    await client.query('BEGIN');
    
    const { name, price, description, image, images, stock_quantity, fields } = req.body;
    const result = await client.query(
      'UPDATE products SET name = $1, price = $2, description = $3, image = $4, stock_quantity = $5 WHERE id = $6 AND tenant_id = $7 RETURNING *',
      [name, price, description, image, stock_quantity !== undefined ? stock_quantity : 1, req.params.id, req.tenant.id]
    );
    
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    
    // Update multiple images
    if (images && Array.isArray(images)) {
      // Deletar imagens antigas do S3 que foram removidas
      const oldImgs = await client.query(
        'SELECT image FROM product_images WHERE product_id = $1 AND tenant_id = $2',
        [req.params.id, req.tenant.id]
      );
      const newSet = new Set(images);
      oldImgs.rows
        .filter(r => r.image && r.image.startsWith('http') && !newSet.has(r.image))
        .forEach(r => deleteFromS3(r.image));

      await client.query('DELETE FROM product_images WHERE product_id = $1 AND tenant_id = $2', [req.params.id, req.tenant.id]);
      for (let i = 0; i < Math.min(images.length, 10); i++) {
        await client.query(
          'INSERT INTO product_images (product_id, image, image_order, tenant_id) VALUES ($1, $2, $3, $4)',
          [req.params.id, images[i], i, req.tenant.id]
        );
      }
    }
    
    // Delete old custom fields
    await client.query('DELETE FROM product_fields WHERE product_id = $1 AND tenant_id = $2', [req.params.id, req.tenant.id]);
    
    // Save new custom fields
    if (fields) {
      for (const [fieldId, value] of Object.entries(fields)) {
        if (value) {
          await client.query(
            'INSERT INTO product_fields (product_id, field_id, value, tenant_id) VALUES ($1, $2, $3, $4)',
            [req.params.id, fieldId, value, req.tenant.id]
          );
        }
      }
    }
    
    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Erro ao atualizar produto:', err);
    res.status(500).json({ error: 'Erro ao atualizar produto' });
  } finally {
    client.release();
  }
});

app.delete('/api/products/:id', authenticateAdmin, async (req, res) => {
  try {
    // Buscar imagens do S3 para deletar
    const imgs = await pool.query(
      'SELECT image FROM product_images WHERE product_id = $1 AND tenant_id = $2',
      [req.params.id, req.tenant.id]
    );
    const mainImg = await pool.query(
      'SELECT image FROM products WHERE id = $1 AND tenant_id = $2',
      [req.params.id, req.tenant.id]
    );

    const result = await pool.query('DELETE FROM products WHERE id = $1 AND tenant_id = $2 RETURNING *', [req.params.id, req.tenant.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    // Deletar imagens do S3 em background
    const allUrls = [
      ...imgs.rows.map(r => r.image),
      mainImg.rows[0]?.image
    ].filter(url => url && url.startsWith('http'));
    allUrls.forEach(url => deleteFromS3(url));

    res.json({ success: true });
  } catch (err) {
    console.error('Erro ao deletar produto:', err);
    res.status(500).json({ error: 'Erro ao deletar produto' });
  }
});

// ========== FIELD DEFINITIONS ==========
app.get('/api/field-definitions', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM field_definitions WHERE tenant_id = $1 ORDER BY field_order', [req.tenant.id]);
    // Parse options de string JSON para array
    const fields = result.rows.map(field => ({
      ...field,
      options: field.options ? JSON.parse(field.options) : null
    }));
    res.json(fields);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/field-definitions', authenticateAdmin, async (req, res) => {
  try {
    const { id, field_name, field_type, field_order, options } = req.body;
    const result = await pool.query(
      'INSERT INTO field_definitions (id, field_name, field_type, is_default, can_delete, field_order, options, tenant_id) VALUES ($1, $2, $3, false, true, $4, $5, $6) RETURNING *',
      [id, field_name, field_type, field_order || 0, options, req.tenant.id]
    );
    const field = result.rows[0];
    field.options = field.options ? JSON.parse(field.options) : null;
    res.status(201).json(field);
  } catch (err) {
    console.error('Erro ao criar campo:', err);
    res.status(500).json({ error: 'Erro ao criar campo' });
  }
});

app.put('/api/field-definitions/:id', authenticateAdmin, async (req, res) => {
  try {
    const { field_name, field_type } = req.body;
    const result = await pool.query(
      'UPDATE field_definitions SET field_name = $1, field_type = $2 WHERE id = $3 AND can_delete = true AND tenant_id = $4 RETURNING *',
      [field_name, field_type, req.params.id, req.tenant.id]
    );
    if (result.rows.length === 0) {
      return res.status(403).json({ error: 'Campo não pode ser editado' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao atualizar campo:', err);
    res.status(500).json({ error: 'Erro ao atualizar campo' });
  }
});

app.delete('/api/field-definitions/:id', authenticateAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM field_definitions WHERE id = $1 AND can_delete = true AND tenant_id = $2 RETURNING *',
      [req.params.id, req.tenant.id]
    );
    if (result.rows.length === 0) {
      return res.status(403).json({ error: 'Campo não pode ser deletado' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Erro ao deletar campo:', err);
    res.status(500).json({ error: 'Erro ao deletar campo' });
  }
});

// ========== ORDERS ==========
app.post('/api/orders', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { customer_id, customer_name, customer_phone, customer_address, payment_method, payment_id, payment_provider_status, payment_status: customPaymentStatus, order_status: customOrderStatus, total, items, created_at } = req.body;
    
    // Buscar markup da config
    const configResult = await client.query(
      'SELECT markup_percentage FROM config WHERE tenant_id = $1 LIMIT 1',
      [req.tenant.id]
    );
    const markup = configResult.rows[0]?.markup_percentage || 0;
    
    // Função para aplicar markup
    const applyMarkup = (basePrice, markupPercentage) => {
      const price = Number(basePrice) || 0;
      const markupPct = Number(markupPercentage) || 0;
      return Number((price / (1 - markupPct / 100)).toFixed(2));
    };
    
    // Se vier com status customizado (registro manual), usar ele. Senão, mapear do gateway
    let payment_status, order_status;
    if (customPaymentStatus && customOrderStatus) {
      // Registro manual - usar status enviados
      payment_status = customPaymentStatus;
      order_status = customOrderStatus;
    } else {
      // Checkout normal - mapear do gateway
      payment_status = payment_provider_status ? mapMercadoPagoStatus(payment_provider_status) : PaymentStatus.PENDING;
      order_status = payment_status === PaymentStatus.APPROVED ? OrderStatus.PAID : OrderStatus.PENDING_PAYMENT;
    }
    
    // Recalcular total no backend
    let calculatedTotal = 0;
    const validatedItems = [];
    
    for (const item of items) {
      // Buscar preço real do produto no banco
      const productResult = await client.query(
        'SELECT price, name, image FROM products WHERE id = $1 AND tenant_id = $2',
        [item.product_id || item.id, req.tenant.id]
      );
      
      if (productResult.rows.length === 0) {
        throw new Error(`Produto ${item.product_id || item.id} não encontrado`);
      }
      
      const product = productResult.rows[0];
      const basePrice = Number(product.price);
      const finalPrice = applyMarkup(basePrice, markup);
      const subtotal = finalPrice * item.quantity;
      
      calculatedTotal += subtotal;
      
      validatedItems.push({
        product_id: item.product_id || item.id,
        product_name: product.name,
        product_price: finalPrice,
        product_image: product.image,
        quantity: item.quantity,
        subtotal: subtotal
      });
    }
    
    const orderResult = await client.query(
      `INSERT INTO orders 
       (customer_id, customer_name, customer_phone, customer_address, payment_method, payment_id, payment_status, order_status, payment_provider_status, total, created_at, tenant_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [customer_id, customer_name, customer_phone, customer_address, payment_method, payment_id, payment_status, order_status, payment_provider_status, calculatedTotal, created_at || new Date(), req.tenant.id]
    );
    
    const order = orderResult.rows[0];
    
    for (const item of validatedItems) {
      await client.query(
        'INSERT INTO order_items (order_id, product_id, product_name, product_price, product_image, quantity, subtotal, tenant_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        [order.id, item.product_id, item.product_name, item.product_price, item.product_image, item.quantity, item.subtotal, req.tenant.id]
      );
      
      // Deduzir do estoque se pagamento aprovado
      if (payment_status === PaymentStatus.APPROVED) {
        await client.query(
          'UPDATE products SET stock_quantity = GREATEST(stock_quantity - $1, 0) WHERE id = $2 AND tenant_id = $3',
          [item.quantity, item.product_id, req.tenant.id]
        );
      }
    }
    
    // Registrar histórico inicial
    await client.query(
      `INSERT INTO order_status_history 
       (order_id, new_payment_status, new_order_status, changed_by, notes, tenant_id)
       VALUES ($1, $2, $3, 'system', 'Pedido criado', $4)`,
      [order.id, payment_status, order_status, req.tenant.id]
    );
    
    await client.query('COMMIT');
    
    // Enviar email de confirmação (não bloqueia o fluxo)
    if (customer_id) {
      pool.query('SELECT email FROM customers WHERE id = $1 AND tenant_id = $2', [customer_id, req.tenant.id])
        .then(customerResult => {
          if (customerResult.rows[0]?.email) {
            const customerEmail = customerResult.rows[0].email;
            
            // Buscar config para cores
            return pool.query('SELECT primary_color, secondary_color, store_name FROM config WHERE tenant_id = $1 LIMIT 1', [req.tenant.id])
              .then(configResult => {
                const config = configResult.rows[0] || {};
                const orderWithEmail = {
                  ...order,
                  customer_email: customerEmail,
                  items: items
                };
                return sendOrderStatusEmail(orderWithEmail, 'pending', config);
              });
          }
        })
        .catch(err => {
          console.error('❌ Erro ao enviar email de confirmação (não crítico):', err);
        });
    }
    
    res.status(201).json(order);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

app.get('/api/orders', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM orders ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/orders/:id', async (req, res) => {
  try {
    const orderResult = await pool.query('SELECT * FROM orders WHERE id = $1', [req.params.id]);
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }
    const order = orderResult.rows[0];
    const itemsResult = await pool.query('SELECT * FROM order_items WHERE order_id = $1', [req.params.id]);
    order.items = itemsResult.rows;
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/orders/customer/:customerId', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT o.*, json_agg(json_build_object(\'product_name\', oi.product_name, \'quantity\', oi.quantity, \'subtotal\', oi.subtotal)) as items FROM orders o LEFT JOIN order_items oi ON o.id = oi.order_id WHERE o.customer_id = $1 GROUP BY o.id ORDER BY o.created_at DESC',
      [req.params.customerId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========== MERCADO PAGO ==========
app.get('/api/mercadopago/public-key', (req, res) => {
  res.json({ publicKey: process.env.MERCADOPAGO_PUBLIC_KEY });
});

app.post('/api/mercadopago/process-payment', async (req, res) => {
  try {
    const payment = new Payment(mercadopago);
    const body = {
      transaction_amount: Number(req.body.transaction_amount),
      token: req.body.token,
      description: req.body.description,
      installments: Number(req.body.installments),
      payment_method_id: req.body.payment_method_id,
      issuer_id: String(req.body.issuer_id),
      payer: {
        email: req.body.payer?.email,
        identification: {
          type: 'CPF',
          number: req.body.payer?.identification?.number?.replace(/\D/g, '')
        }
      }
    };
    
    const result = await payment.create({ body });
    
    // Mapear status do MP para status interno
    const paymentStatus = mapMercadoPagoStatus(result.status);
    
    res.json({
      ...result,
      internal_payment_status: paymentStatus
    });
  } catch (err) {
    console.error('Erro ao processar pagamento:', err.message);
    res.status(500).json({ error: err.message, details: err.cause });
  }
});

app.post('/api/mercadopago/create-pix', async (req, res) => {
  try {
    const payment = new Payment(mercadopago);
    const body = {
      transaction_amount: req.body.transaction_amount,
      description: req.body.description,
      payment_method_id: 'pix',
      payer: {
        email: req.body.payer.email,
        first_name: req.body.payer.first_name,
        last_name: req.body.payer.last_name,
        identification: {
          type: 'CPF',
          number: req.body.payer.identification.number
        }
      }
    };
    const result = await payment.create({ body });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/mercadopago/create-boleto', async (req, res) => {
  try {
    const payment = new Payment(mercadopago);
    const body = {
      transaction_amount: req.body.transaction_amount,
      description: req.body.description,
      payment_method_id: 'bolbradesco',
      payer: {
        email: req.body.payer.email,
        first_name: req.body.payer.first_name,
        last_name: req.body.payer.last_name,
        identification: {
          type: req.body.payer.identification.type,
          number: req.body.payer.identification.number
        }
      }
    };
    const result = await payment.create({ body });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========== STATUS MANAGEMENT ==========

// Atualizar status do pedido (admin)
app.put('/api/orders/:id/status', authenticateAdmin, async (req, res) => {
  console.log('🔄 Recebendo requisição para atualizar status');
  console.log('Order ID:', req.params.id);
  console.log('Body:', req.body);
  
  try {
    const { order_status, tracking_code, delivery_deadline, notes } = req.body;
    
    console.log('📦 Buscando pedido...');
    
    // Buscar pedido completo com email do cliente
    const orderResult = await pool.query(`
      SELECT o.*, 
        c.email as customer_email,
        json_agg(json_build_object(
          'id', oi.id,
          'product_id', oi.product_id,
          'product_name', oi.product_name,
          'product_price', oi.product_price,
          'quantity', oi.quantity,
          'subtotal', oi.subtotal,
          'product_image', p.image
        )) as items
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id AND c.tenant_id = $2
      LEFT JOIN order_items oi ON o.id = oi.order_id AND oi.tenant_id = $2
      LEFT JOIN products p ON oi.product_id = p.id AND p.tenant_id = $2
      WHERE o.id = $1 AND o.tenant_id = $2
      GROUP BY o.id, c.email
    `, [req.params.id, req.tenant.id]);
    
    const order = orderResult.rows[0];
    console.log('📦 Pedido encontrado:', order ? 'Sim' : 'Não');
    
    console.log('🔄 Atualizando status...');
    
    // Atualizar status
    const result = await updateOrderStatusManual(pool, req.params.id, order_status, req.user.username, notes, req.tenant.id);
    
    console.log('✅ Status atualizado:', result);
    
    // Atualizar rastreio se fornecido
    if (tracking_code || delivery_deadline) {
      await pool.query(
        'UPDATE orders SET tracking_code = $1, delivery_deadline = $2 WHERE id = $3 AND tenant_id = $4',
        [tracking_code || null, delivery_deadline || null, req.params.id, req.tenant.id]
      );
      
      // Atualizar objeto order com novos valores
      order.tracking_code = tracking_code || null;
      order.delivery_deadline = delivery_deadline || null;
    }
    
    // Enviar email (não bloqueia o fluxo se falhar)
    if (order && order.customer_email) {
      console.log('📧 Enviando email para:', order.customer_email);
      console.log('📦 Dados do pedido:', {
        tracking_code: order.tracking_code,
        delivery_deadline: order.delivery_deadline
      });
      
      // Buscar configurações para cores
      pool.query('SELECT primary_color, secondary_color, store_name FROM config WHERE tenant_id = $1 LIMIT 1', [req.tenant.id])
        .then(configResult => {
          const config = configResult.rows[0] || {};
          return sendOrderStatusEmail(order, order_status, config);
        })
        .catch(err => {
          console.error('❌ Erro ao enviar email (não crítico):', err);
        });
    } else {
      console.warn('⚠️ Pedido sem email do cliente:', req.params.id);
    }
    
    res.json(result);
  } catch (err) {
    console.error('❌ ERRO ao atualizar status:', err);
    res.status(400).json({ error: err.message });
  }
});


// Atualizar pagamento do pedido
app.put('/api/orders/:id/payment', async (req, res) => {
  try {
    const { payment_id, payment_status, payment_method } = req.body;
    
    // Mapear status do MP para status interno
    const internalPaymentStatus = mapMercadoPagoStatus(payment_status);
    
    await pool.query(
      'UPDATE orders SET payment_id = $1, payment_status = $2, payment_method = $3 WHERE id = $4',
      [payment_id, internalPaymentStatus, payment_method, req.params.id]
    );
    
    // Se pagamento aprovado, atualizar status do pedido para processing
    if (payment_status === 'approved') {
      await updateOrderStatus(pool, req.params.id, payment_status, 'system', 'Pagamento aprovado');
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error('Erro ao atualizar pagamento:', err.message);
    res.status(400).json({ error: err.message });
  }
});

// Buscar histórico de status
app.get('/api/orders/:id/history', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM order_status_history WHERE order_id = $1 ORDER BY created_at DESC',
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Webhook do Mercado Pago
app.post('/api/webhooks/mercadopago', async (req, res) => {
  try {
    const { type, data } = req.body;
    
    if (type === 'payment') {
      const paymentId = data.id;
      
      // Buscar detalhes do pagamento
      const payment = new Payment(mercadopago);
      const paymentData = await payment.get({ id: paymentId });
      
      // Buscar pedido pelo payment_id
      const orderResult = await pool.query(
        'SELECT id FROM orders WHERE payment_id = $1',
        [String(paymentId)]
      );
      
      if (orderResult.rows.length > 0) {
        const orderId = orderResult.rows[0].id;
        await updateOrderStatus(pool, orderId, paymentData.status, 'webhook', `Webhook do Mercado Pago: ${paymentData.status_detail}`);
      }
    }
    
    res.status(200).send('OK');
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend rodando em http://localhost:${PORT}`);
});
