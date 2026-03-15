import { useState, useEffect, useCallback, useRef } from 'react';
import { Product } from '../types';
import { api } from '../services/api';

/**
 * Hook para carregamento infinito de produtos.
 * 
 * - Busca produtos paginados (24 por vez)
 * - Acumula no state conforme o usuário rola
 * - Para quando nextPage é null (sem mais produtos)
 * - Reseta ao mudar o termo de busca
 * - Evita requests duplicados com flag de loading
 */
export function useInfiniteProducts(search: string, limit = 10) {
  const [products, setProducts] = useState<Product[]>([]);
  const [nextPage, setNextPage] = useState<number | null>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  // Ref para evitar race conditions quando search muda durante um fetch
  const currentSearch = useRef(search);

  // Reset quando search muda
  useEffect(() => {
    currentSearch.current = search;
    setProducts([]);
    setNextPage(1);
    setError(null);
  }, [search]);

  const loadMore = useCallback(async () => {
    if (loading || nextPage === null) return;

    setLoading(true);
    setError(null);
    try {
      const data = await api.getProductsPage(nextPage, limit, search);
      // Ignora resposta se search mudou enquanto o fetch estava em andamento
      if (currentSearch.current !== search) return;

      const items = Array.isArray(data) ? data : (data.products || []);
      const next = Array.isArray(data) ? null : (data.nextPage ?? null);
      const count = Array.isArray(data) ? items.length : (data.total ?? 0);

      setProducts(prev => nextPage === 1 ? items : [...prev, ...items]);
      setNextPage(next);
      setTotal(count);
    } catch {
      setError('Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  }, [nextPage, loading, search, limit]);

  // Carrega primeira página automaticamente
  useEffect(() => {
    if (nextPage === 1) {
      loadMore();
    }
  }, [nextPage]); // eslint-disable-line react-hooks/exhaustive-deps

  return { products, loading, error, hasMore: nextPage !== null, total, loadMore };
}
