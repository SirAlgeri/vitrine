import { pool } from '../db.js';

// Cache simples em memória para tenants
const tenantCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

/**
 * Middleware para identificar e validar o tenant baseado no subdomínio
 */
export async function tenantMiddleware(req, res, next) {
  try {
    const host = req.get('host') || '';
    const parts = host.split('.');
    let subdomain = 'www';

    if (/^\d+\.\d+\.\d+\.\d+/.test(host.split(':')[0])) {
      subdomain = 'www';
    } else if (host.includes('.localhost')) {
      subdomain = parts[0];
    } else if (host.startsWith('localhost') || host.startsWith('www.localhost')) {
      subdomain = 'www';
    } else if (parts.length >= 3) {
      subdomain = parts[0];
    }

    // Verificar cache
    const cached = tenantCache.get(subdomain);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      req.tenant = cached.data;
      return next();
    }

    const result = await pool.query(
      'SELECT * FROM tenants WHERE subdomain = $1 AND active = true',
      [subdomain]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Loja não encontrada',
        subdomain: subdomain
      });
    }

    // Salvar no cache
    tenantCache.set(subdomain, { data: result.rows[0], timestamp: Date.now() });
    req.tenant = result.rows[0];

    next();
  } catch (error) {
    console.error('Erro no middleware de tenant:', error);
    res.status(500).json({ error: 'Erro ao identificar loja' });
  }
}

/**
 * Middleware para rotas administrativas (sem tenant)
 * Usado para gerenciar tenants
 */
export function skipTenantMiddleware(req, res, next) {
  req.skipTenant = true;
  next();
}
