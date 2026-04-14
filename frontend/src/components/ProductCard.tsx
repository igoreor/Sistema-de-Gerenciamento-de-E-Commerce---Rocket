import { Eye, Pencil, Trash2, Star, MoreVertical, Package } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { Product } from '@/types';

interface ProductCardProps {
  product: Product;
  imageUrl?: string | null;
  onView: (product: Product) => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

function categoryGradient(category: string): string {
  const hash = [...category].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const hue = hash % 360;
  return `hsl(${hue}, 55%, 50%)`;
}

export function ProductCard({ product, imageUrl, onView, onEdit, onDelete }: ProductCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const accentColor = categoryGradient(product.category);

  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card transition-all hover:shadow-lg">
      {/* Image / Color banner */}
      <div
        className="relative flex aspect-[4/3] items-center justify-center overflow-hidden"
        style={!imageUrl ? { backgroundColor: accentColor + '22' } : undefined}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.category}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
              (e.currentTarget.nextElementSibling as HTMLElement | null)?.removeAttribute('style');
            }}
          />
        ) : null}
        <div
          className="flex h-20 w-20 items-center justify-center rounded-2xl shadow-lg"
          style={imageUrl ? { display: 'none' } : { backgroundColor: accentColor }}
        >
          <Package className="h-10 w-10 text-white" />
        </div>

        {/* Quick Actions Overlay */}
        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={() => onView(product)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-gray-900 transition-transform hover:scale-110"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => onEdit(product)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-gray-900 transition-transform hover:scale-110"
          >
            <Pencil className="h-4 w-4" />
          </button>
        </div>

        {/* Menu */}
        <div className="absolute right-3 top-3" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-gray-900 opacity-0 transition-opacity group-hover:opacity-100"
          >
            <MoreVertical className="h-4 w-4" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-10 z-10 w-36 overflow-hidden rounded-lg border border-border bg-card shadow-lg">
              <button
                onClick={() => { onView(product); setShowMenu(false); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent"
              >
                <Eye className="h-4 w-4" />
                Visualizar
              </button>
              <button
                onClick={() => { onEdit(product); setShowMenu(false); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent"
              >
                <Pencil className="h-4 w-4" />
                Editar
              </button>
              <button
                onClick={() => { onDelete(product); setShowMenu(false); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
                Excluir
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="mb-2">
          <p className="text-xs text-muted-foreground">{product.category}</p>
          <h3 className="font-semibold leading-tight line-clamp-2">{product.name}</h3>
        </div>

        {product.peso !== null && product.peso !== undefined && (
          <p className="mb-3 text-sm text-muted-foreground">
            {product.peso.toLocaleString('pt-BR')} g
          </p>
        )}

        <div className="flex items-center justify-between">
          {product.rating !== null ? (
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="text-sm font-medium">{product.rating.toFixed(1)}</span>
              <span className="text-xs text-muted-foreground">
                ({product.reviewCount})
              </span>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">Sem avaliações</span>
          )}
        </div>
      </div>
    </div>
  );
}
