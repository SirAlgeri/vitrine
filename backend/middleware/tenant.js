import { pool } from '../db.js';

/**
 * Middleware para identificar e validar o tenant baseado no subdomínio
 */
export async function tenantMiddleware(req, res, next) {
  try {
    // Extrair host do header
    const host = req.get('host') || '';

    // Extrair subdomínio (ex: mcptennis.meudominio.com -> mcptennis)
    const parts = host.split('.');
    let subdomain = 'www'; // padrão

    // Se é localhost ou IP, usar 'www'
    if (host.includes('localhost') || /^\d+\.\d+\.\d+\.\d+/.test(host)) {
      subdomain = 'www';
    }
    // Se tem mais de 2 partes (ex: mcptennis.meudominio.com)
    else if (parts.length >= 3) {
      subdomain = parts[0];
    }

    // Buscar tenant no banco
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

    // Adicionar tenant ao request
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
