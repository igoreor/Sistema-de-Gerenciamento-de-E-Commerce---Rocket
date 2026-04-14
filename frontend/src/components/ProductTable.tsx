import { Eye, Pencil, Trash2, Star, MoreHorizontal, Package } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Product } from '@/types';

interface ProductTableProps {
  products: Product[];
  onView: (product: Product) => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

export function ProductTable({ products, onView, onEdit, onDelete }: ProductTableProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                Produto
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                Categoria
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                Peso (g)
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                Dimensões (cm)
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                Avaliação
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                Ações
              </th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr
                key={product.id}
                className="border-b border-border transition-colors last:border-0 hover:bg-muted/30"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <Package className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="max-w-xs truncate font-medium">{product.name}</p>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm">{product.category}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {product.peso !== null && product.peso !== undefined
                    ? product.peso.toLocaleString('pt-BR')
                    : '—'}
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {product.comprimento !== null && product.comprimento !== undefined
                    ? `${product.comprimento} × ${product.altura ?? '—'} × ${product.largura ?? '—'}`
                    : '—'}
                </td>
                <td className="px-4 py-3">
                  {product.rating !== null ? (
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      <span className="font-medium">{product.rating.toFixed(1)}</span>
                      <span className="text-xs text-muted-foreground">
                        ({product.reviewCount})
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onView(product)}
                      className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
                      title="Visualizar"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onEdit(product)}
                      className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
                      title="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <div
                      className="relative"
                      ref={openMenuId === product.id ? menuRef : null}
                    >
                      <button
                        onClick={() =>
                          setOpenMenuId(openMenuId === product.id ? null : product.id)
                        }
                        className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>

                      {openMenuId === product.id && (
                        <div className="absolute right-0 top-10 z-10 w-36 overflow-hidden rounded-lg border border-border bg-card shadow-lg">
                          <button
                            onClick={() => {
                              onDelete(product);
                              setOpenMenuId(null);
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                            Excluir
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
