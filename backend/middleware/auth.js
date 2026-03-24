import jwt from 'jsonwebtoken';

if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET não definido nas variáveis de ambiente');
  process.exit(1);
}
const JWT_SECRET = process.env.JWT_SECRET;

export function authenticateAdmin(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const token = authHeader.split(' ')[1];
    
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    
    // Verificar se o usuário pertence ao tenant atual
    if (req.tenant && decoded.tenant_id !== req.tenant.id) {
      return res.status(403).json({ error: 'Acesso negado a este tenant' });
    }
    
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado' });
    }
    return res.status(401).json({ error: 'Token inválido' });
  }
}

export function authenticateCustomer(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (decoded.role !== 'customer') {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    
    if (req.tenant && decoded.tenant_id !== req.tenant.id) {
      return res.status(403).json({ error: 'Acesso negado a este tenant' });
    }
    
    req.customer = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado' });
    }
    return res.status(401).json({ error: 'Token inválido' });
  }
}

// Aceita admin OU customer autenticado
export function authenticateAny(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (req.tenant && decoded.tenant_id !== req.tenant.id) {
      return res.status(403).json({ error: 'Acesso negado a este tenant' });
    }
    
    if (decoded.role === 'customer') {
      req.customer = decoded;
    } else {
      req.user = decoded;
    }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

export function generateToken(user) {
  return jwt.sign(
    { 
      id: user.id, 
      username: user.username,
      tenant_id: user.tenant_id 
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

export function generateCustomerToken(customer, tenantId) {
  return jwt.sign(
    { 
      id: customer.id, 
      email: customer.email,
      role: 'customer',
      tenant_id: tenantId
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}
