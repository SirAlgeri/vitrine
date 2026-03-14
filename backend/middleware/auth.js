import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret-in-production';

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
