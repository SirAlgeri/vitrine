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
import { sendOrderStatusEmail } from './emailService.js';

dotenv.config();

const mercadopago = new MercadoPagoConfig({ 
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN 
});

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// ========== CONFIG ==========
app.get('/api/config', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM config LIMIT 1');
    res.json(result.rows[0] || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/config', async (req, res) => {
  try {
    const { store_name, primary_color, secondary_color, whatsapp_number, logo_url, enable_online_checkout, enable_whatsapp_checkout, payment_methods, markup_percentage, cep_origem } = req.body;
    
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
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }
    
    const result = await pool.query(
      `UPDATE config SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = 1 RETURNING *`,
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
    
    const postData = JSON.stringify({
      cepOrigem,
      cepDestino,
      peso: peso || 0.3,
      comprimento: comprimento || 16,
      altura: altura || 2,
      largura: largura || 11
    });

    const options = {
      hostname: 'localhost',
      port: 5001,
      path: '/calcular',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const resultado = await new Promise((resolve, reject) => {
      const req = http.request(options, (response) => {
        let data = '';
        response.on('data', (chunk) => { data += chunk; });
        response.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error('Resposta inválida do serviço de frete'));
          }
        });
      });
      req.on('error', reject);
      req.write(postData);
      req.end();
    });

    res.json(resultado);
  } catch (err) {
    console.error('Erro ao calcular frete:', err);
    res.status(500).json({ error: err.message });
  }
});

// ========== AUTH ==========
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    // Accept both username and email (for backwards compatibility)
    const emailOrUsername = username;
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [emailOrUsername]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    
    if (!valid) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    res.json({ success: true, username: user.username });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========== CUSTOMER AUTH ==========
app.post('/api/customers/register', async (req, res) => {
  try {
    const { nome_completo, email, senha, telefone, aceita_marketing } = req.body;
    
    const existing = await pool.query('SELECT id FROM customers WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }
    
    const id = crypto.randomUUID();
    const senha_hash = await bcrypt.hash(senha, 10);
    
    const result = await pool.query(
      `INSERT INTO customers (id, nome_completo, email, senha_hash, telefone, aceita_marketing)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, nome_completo, email, telefone, aceita_marketing, status, criado_em`,
      [id, nome_completo, email, senha_hash, telefone, aceita_marketing || false]
    );
    
    res.status(201).json({ customer: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/customers/login', async (req, res) => {
  try {
    const { email, senha } = req.body;
    
    const result = await pool.query('SELECT * FROM customers WHERE email = $1 AND deletado_em IS NULL', [email]);
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
    await pool.query('UPDATE customers SET ultimo_login_em = CURRENT_TIMESTAMP WHERE id = $1', [customer.id]);
    
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
      `INSERT INTO customers (id, nome_completo, telefone, cpf, email, cep, endereco, numero, complemento, bairro, cidade, estado, status, senha_hash)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'ativo', '')
       RETURNING id, nome_completo, email, telefone, cpf, cep, endereco, numero, complemento, bairro, cidade, estado`,
      [nome_completo, telefone || '', cpf || null, email || null, cep || null, endereco || null, numero || null, complemento || null, bairro || null, cidade || null, estado || null]
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
       WHERE id = $12 AND deletado_em IS NULL
       RETURNING id, nome_completo, email, telefone, cpf, cep, endereco, numero, complemento, bairro, cidade, estado, aceita_marketing, status, criado_em, ultimo_login_em`,
      [nome_completo, telefone, cpf, cep, endereco, numero, complemento, bairro, cidade, estado, aceita_marketing, req.params.id]
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
    
    const result = await pool.query('SELECT senha_hash FROM customers WHERE id = $1 AND deletado_em IS NULL', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }
    
    const valid = await bcrypt.compare(senha_atual, result.rows[0].senha_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Senha atual incorreta' });
    }
    
    const senha_hash = await bcrypt.hash(senha_nova, 10);
    await pool.query('UPDATE customers SET senha_hash = $1 WHERE id = $2', [senha_hash, req.params.id]);
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/customers/:id', async (req, res) => {
  try {
    await pool.query('UPDATE customers SET deletado_em = CURRENT_TIMESTAMP, status = $1 WHERE id = $2', ['inativo', req.params.id]);
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
        'UPDATE customer_addresses SET is_default = false WHERE customer_id = $1',
        [req.params.id]
      );
    }
    
    const result = await client.query(
      `INSERT INTO customer_addresses (id, customer_id, nome_endereco, cep, rua, numero, complemento, bairro, cidade, estado, is_default)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [id, req.params.id, nome_endereco, cep, rua, numero, complemento, bairro, cidade, estado, is_default || false]
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
    const productsResult = await client.query('SELECT * FROM products ORDER BY created_at DESC');
    const products = productsResult.rows;
    
    // Load custom fields and images for each product
    for (const product of products) {
      const fieldsResult = await client.query(
        'SELECT field_id, value FROM product_fields WHERE product_id = $1',
        [product.id]
      );
      product.fields = {};
      fieldsResult.rows.forEach(row => {
        product.fields[row.field_id] = row.value;
      });
      
      // Load images
      const imagesResult = await client.query(
        'SELECT image FROM product_images WHERE product_id = $1 ORDER BY image_order',
        [product.id]
      );
      product.images = imagesResult.rows.map(row => row.image);
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
    const result = await client.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    
    const product = result.rows[0];
    const fieldsResult = await client.query(
      'SELECT field_id, value FROM product_fields WHERE product_id = $1',
      [product.id]
    );
    product.fields = {};
    fieldsResult.rows.forEach(row => {
      product.fields[row.field_id] = row.value;
    });
    
    // Load images
    const imagesResult = await client.query(
      'SELECT image FROM product_images WHERE product_id = $1 ORDER BY image_order',
      [product.id]
    );
    product.images = imagesResult.rows.map(row => row.image);
    
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

app.post('/api/products', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { id, name, price, description, image, images, fields } = req.body;
    const result = await client.query(
      'INSERT INTO products (id, name, price, description, image) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [id, name, price, description, image]
    );
    
    // Save multiple images
    if (images && Array.isArray(images)) {
      for (let i = 0; i < Math.min(images.length, 10); i++) {
        await client.query(
          'INSERT INTO product_images (product_id, image, image_order) VALUES ($1, $2, $3)',
          [id, images[i], i]
        );
      }
    }
    
    // Save custom fields
    if (fields) {
      for (const [fieldId, value] of Object.entries(fields)) {
        if (value) {
          await client.query(
            'INSERT INTO product_fields (product_id, field_id, value) VALUES ($1, $2, $3)',
            [id, fieldId, value]
          );
        }
      }
    }
    
    await client.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

app.put('/api/products/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { name, price, description, image, images, fields } = req.body;
    const result = await client.query(
      'UPDATE products SET name = $1, price = $2, description = $3, image = $4 WHERE id = $5 RETURNING *',
      [name, price, description, image, req.params.id]
    );
    
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    
    // Update multiple images
    if (images && Array.isArray(images)) {
      await client.query('DELETE FROM product_images WHERE product_id = $1', [req.params.id]);
      for (let i = 0; i < Math.min(images.length, 10); i++) {
        await client.query(
          'INSERT INTO product_images (product_id, image, image_order) VALUES ($1, $2, $3)',
          [req.params.id, images[i], i]
        );
      }
    }
    
    // Delete old custom fields
    await client.query('DELETE FROM product_fields WHERE product_id = $1', [req.params.id]);
    
    // Save new custom fields
    if (fields) {
      for (const [fieldId, value] of Object.entries(fields)) {
        if (value) {
          await client.query(
            'INSERT INTO product_fields (product_id, field_id, value) VALUES ($1, $2, $3)',
            [req.params.id, fieldId, value]
          );
        }
      }
    }
    
    await client.query('COMMIT');
    res.json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========== FIELD DEFINITIONS ==========
app.get('/api/field-definitions', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM field_definitions ORDER BY field_order');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/field-definitions', async (req, res) => {
  try {
    const { id, field_name, field_type, field_order, options } = req.body;
    const result = await pool.query(
      'INSERT INTO field_definitions (id, field_name, field_type, is_default, can_delete, field_order, options) VALUES ($1, $2, $3, false, true, $4, $5) RETURNING *',
      [id, field_name, field_type, field_order || 0, options]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/field-definitions/:id', async (req, res) => {
  try {
    const { field_name, field_type } = req.body;
    const result = await pool.query(
      'UPDATE field_definitions SET field_name = $1, field_type = $2 WHERE id = $3 AND can_delete = true RETURNING *',
      [field_name, field_type, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(403).json({ error: 'Campo não pode ser editado' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/field-definitions/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM field_definitions WHERE id = $1 AND can_delete = true RETURNING *',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(403).json({ error: 'Campo não pode ser deletado' });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========== ORDERS ==========
app.post('/api/orders', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { customer_id, customer_name, customer_phone, customer_address, payment_method, payment_id, payment_provider_status, payment_status: customPaymentStatus, order_status: customOrderStatus, total, items, created_at } = req.body;
    
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
    
    const orderResult = await client.query(
      `INSERT INTO orders 
       (customer_id, customer_name, customer_phone, customer_address, payment_method, payment_id, payment_status, order_status, payment_provider_status, total, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [customer_id, customer_name, customer_phone, customer_address, payment_method, payment_id, payment_status, order_status, payment_provider_status, total, created_at || new Date()]
    );
    
    const order = orderResult.rows[0];
    
    for (const item of items) {
      await client.query(
        'INSERT INTO order_items (order_id, product_id, product_name, product_price, product_image, quantity, subtotal) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [order.id, item.product_id || item.id, item.product_name || item.name, item.product_price || item.price, item.product_image || item.image, item.quantity, item.subtotal || (item.price * item.quantity)]
      );
    }
    
    // Registrar histórico inicial
    await client.query(
      `INSERT INTO order_status_history 
       (order_id, new_payment_status, new_order_status, changed_by, notes)
       VALUES ($1, $2, $3, 'system', 'Pedido criado')`,
      [order.id, payment_status, order_status]
    );
    
    await client.query('COMMIT');
    
    // Enviar email de confirmação (não bloqueia o fluxo)
    if (customer_id) {
      pool.query('SELECT email FROM customers WHERE id = $1', [customer_id])
        .then(customerResult => {
          if (customerResult.rows[0]?.email) {
            const customerEmail = customerResult.rows[0].email;
            
            // Buscar config para cores
            return pool.query('SELECT primary_color, secondary_color, store_name FROM config LIMIT 1')
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
app.put('/api/orders/:id/status', async (req, res) => {
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
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE o.id = $1
      GROUP BY o.id, c.email
    `, [req.params.id]);
    
    const order = orderResult.rows[0];
    console.log('📦 Pedido encontrado:', order ? 'Sim' : 'Não');
    
    console.log('🔄 Atualizando status...');
    
    // Atualizar status
    const result = await updateOrderStatusManual(pool, req.params.id, order_status, 'admin', notes);
    
    console.log('✅ Status atualizado:', result);
    
    // Atualizar rastreio se fornecido
    if (tracking_code || delivery_deadline) {
      await pool.query(
        'UPDATE orders SET tracking_code = $1, delivery_deadline = $2 WHERE id = $3',
        [tracking_code || null, delivery_deadline || null, req.params.id]
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
      pool.query('SELECT primary_color, secondary_color, store_name FROM config LIMIT 1')
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
