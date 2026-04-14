import { X, Star, Package, Tag, TrendingUp, Loader2, DollarSign } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Product } from '@/types';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { api, BackendProductDetail } from '@/services/api';

interface ProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ProductModal({ product, isOpen, onClose }: ProductModalProps) {
  const [detail, setDetail] = useState<BackendProductDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    if (!isOpen || !product) {
      setDetail(null);
      return;
    }
    setLoadingDetail(true);
    api.produtos
      .get(product.id)
      .then(setDetail)
      .catch(() => setDetail(null))
      .finally(() => setLoadingDetail(false));
  }, [isOpen, product]);

  if (!product) return null;

  return (
    <AnimatePresence>
      {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.5 }}
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-xl font-semibold">Detalhes do Produto</h2>
              <button onClick={onClose} className="rounded-lg p-2 hover:bg-accent">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Header info */}
              <div className="mb-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Tag className="h-4 w-4" />
                  {product.category}
                </div>
                <h3 className="mt-1 text-2xl font-bold">{product.name}</h3>

                {product.rating !== null && (
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                      <span className="text-xl font-bold">{product.rating.toFixed(1)}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      baseado em {formatNumber(product.reviewCount)} avaliações
                    </span>
                  </div>
                )}
              </div>

              {/* Dimensions */}
              {(product.peso !== null || product.comprimento !== null) && (
                <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {product.peso !== null && product.peso !== undefined && (
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-xs text-muted-foreground">Peso</p>
                      <p className="mt-1 font-semibold">
                        {product.peso.toLocaleString('pt-BR')} g
                      </p>
                    </div>
                  )}
                  {product.comprimento !== null && product.comprimento !== undefined && (
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-xs text-muted-foreground">Comprimento</p>
                      <p className="mt-1 font-semibold">{product.comprimento} cm</p>
                    </div>
                  )}
                  {product.altura !== null && product.altura !== undefined && (
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-xs text-muted-foreground">Altura</p>
                      <p className="mt-1 font-semibold">{product.altura} cm</p>
                    </div>
                  )}
                  {product.largura !== null && product.largura !== undefined && (
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-xs text-muted-foreground">Largura</p>
                      <p className="mt-1 font-semibold">{product.largura} cm</p>
                    </div>
                  )}
                </div>
              )}

              {/* Sales & Reviews from detail */}
              {loadingDetail ? (
                <div className="flex h-24 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : detail ? (
                <>
                  {/* Vendas stats */}
                  <div className="mb-6 grid grid-cols-3 gap-3">
                    <div className="rounded-lg bg-muted/50 p-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Package className="h-4 w-4" />
                        <span className="text-sm">Unidades vendidas</span>
                      </div>
                      <p className="mt-1 text-2xl font-bold">
                        {formatNumber(detail.vendas.total_unidades_vendidas)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <DollarSign className="h-4 w-4" />
                        <span className="text-sm">Receita</span>
                      </div>
                      <p className="mt-1 text-2xl font-bold">
                        {formatCurrency(detail.vendas.receita_total)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <TrendingUp className="h-4 w-4" />
                        <span className="text-sm">Preço médio</span>
                      </div>
                      <p className="mt-1 text-2xl font-bold">
                        {formatCurrency(detail.vendas.preco_medio)}
                      </p>
                    </div>
                  </div>

                  {/* Reviews */}
                  {detail.avaliacoes.avaliacoes.length > 0 && (
                    <div className="border-t border-border pt-6">
                      <h4 className="mb-4 text-lg font-semibold">
                        Avaliações ({formatNumber(detail.avaliacoes.total_avaliacoes)})
                      </h4>
                      <div className="space-y-3">
                        {detail.avaliacoes.avaliacoes.slice(0, 10).map((rev) => (
                          <div
                            key={rev.id_avaliacao}
                            className="rounded-lg border border-border bg-muted/30 p-4"
                          >
                            <div className="mb-2 flex items-center gap-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={
                                    i < rev.avaliacao
                                      ? 'h-4 w-4 fill-amber-400 text-amber-400'
                                      : 'h-4 w-4 fill-muted text-muted'
                                  }
                                />
                              ))}
                              {rev.data_comentario && (
                                <span className="ml-auto text-xs text-muted-foreground">
                                  {new Date(rev.data_comentario).toLocaleDateString('pt-BR')}
                                </span>
                              )}
                            </div>
                            {rev.titulo_comentario && (
                              <p className="mb-1 font-medium">{rev.titulo_comentario}</p>
                            )}
                            {rev.comentario && (
                              <p className="text-sm text-muted-foreground">{rev.comentario}</p>
                            )}
                            {rev.resposta_gerente && (
                              <div className="mt-3 rounded-lg bg-primary/10 p-3 text-sm">
                                <span className="font-medium text-primary">Resposta: </span>
                                {rev.resposta_gerente}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : null}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
