import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Plus,
  Grid3X3,
  List,
  Filter,
  ArrowUpDown,
  X,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Product, ViewMode, ProductFilters, SortField } from '@/types';
import { api, BackendProduct, CategoriaResponse } from '@/services/api';
import { ProductCard } from '@/components/ProductCard';
import { ProductTable } from '@/components/ProductTable';
import { ProductModal } from '@/components/ProductModal';
import { ProductFormModal } from '@/components/ProductFormModal';
import { DeleteConfirmModal } from '@/components/DeleteConfirmModal';
import { toast } from 'sonner';

function mapProduct(p: BackendProduct): Product {
  return {
    id: p.id_produto,
    name: p.nome_produto,
    category: p.categoria_produto,
    rating: p.media_avaliacao,
    reviewCount: p.total_avaliacoes,
    peso: p.peso_produto_gramas,
    comprimento: p.comprimento_centimetros,
    altura: p.altura_centimetros,
    largura: p.largura_centimetros,
  };
}

const sortOptions: { value: SortField; apiValue: string; label: string }[] = [
  { value: 'name', apiValue: 'nome_asc', label: 'Nome (A-Z)' },
  { value: 'name', apiValue: 'nome_desc', label: 'Nome (Z-A)' },
  { value: 'reviewCount', apiValue: 'mais_vendidos', label: 'Mais Vendidos' },
  { value: 'rating', apiValue: 'avaliacao_desc', label: 'Melhor Avaliados' },
];

const LIMIT = 20;

export function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);

  const [categorias, setCategorias] = useState<CategoriaResponse[]>([]);

  const categoryImageMap = Object.fromEntries(
    categorias.map((c) => [c.nome, c.imagem_url])
  );

  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showFilters, setShowFilters] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  const [filters, setFilters] = useState<ProductFilters>({
    search: '',
    category: '',
    sortField: 'name',
    sortOrder: 'asc',
  });
  const [sortOption, setSortOption] = useState('mais_vendidos');

  // Fetch categories once
  useEffect(() => {
    api.categorias.list().then(setCategorias).catch(() => {});
  }, []);

  const fetchProducts = useCallback(
    async (currentPage: number) => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.produtos.list({
          page: currentPage,
          limit: LIMIT,
          busca: filters.search || undefined,
          categoria: filters.category || undefined,
          ordenar: sortOption as '' | 'nome_asc' | 'nome_desc' | 'mais_vendidos' | 'avaliacao_desc',
        });
        setProducts(res.items.map(mapProduct));
        setTotal(res.total);
        setPages(res.pages);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Erro ao carregar produtos');
      } finally {
        setLoading(false);
      }
    },
    [filters.search, filters.category, sortOption]
  );

  // Reset page to 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [filters.search, filters.category, sortOption]);

  useEffect(() => {
    fetchProducts(page);
  }, [fetchProducts, page]);

  // Debounce search input
  const [searchInput, setSearchInput] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((f) => ({ ...f, search: searchInput }));
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleViewProduct = (product: Product) => {
    setSelectedProduct(product);
    setShowProductModal(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowFormModal(true);
  };

  const handleDeleteProduct = (product: Product) => {
    setDeletingProduct(product);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingProduct) return;
    try {
      await api.produtos.delete(deletingProduct.id);
      toast.success('Produto excluído com sucesso!');
      fetchProducts(page);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erro ao excluir produto');
    } finally {
      setShowDeleteModal(false);
      setDeletingProduct(null);
    }
  };

  const handleSaveProduct = async (productData: Partial<Product> & {
    nome_produto?: string;
    categoria_produto?: string;
    peso_produto_gramas?: number | null;
    comprimento_centimetros?: number | null;
    altura_centimetros?: number | null;
    largura_centimetros?: number | null;
  }) => {
    try {
      if (editingProduct) {
        await api.produtos.update(editingProduct.id, {
          nome_produto: productData.nome_produto,
          categoria_produto: productData.categoria_produto,
          peso_produto_gramas: productData.peso_produto_gramas,
          comprimento_centimetros: productData.comprimento_centimetros,
          altura_centimetros: productData.altura_centimetros,
          largura_centimetros: productData.largura_centimetros,
        });
        toast.success('Produto atualizado com sucesso!');
      } else {
        await api.produtos.create({
          nome_produto: productData.nome_produto ?? '',
          categoria_produto: productData.categoria_produto ?? '',
          peso_produto_gramas: productData.peso_produto_gramas,
          comprimento_centimetros: productData.comprimento_centimetros,
          altura_centimetros: productData.altura_centimetros,
          largura_centimetros: productData.largura_centimetros,
        });
        toast.success('Produto criado com sucesso!');
      }
      fetchProducts(page);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erro ao salvar produto');
    } finally {
      setShowFormModal(false);
      setEditingProduct(null);
    }
  };

  const handleCreateProduct = () => {
    setEditingProduct(null);
    setShowFormModal(true);
  };

  const clearFilters = () => {
    setSearchInput('');
    setFilters({ search: '', category: '', sortField: 'name', sortOrder: 'asc' });
    setSortOption('mais_vendidos');
  };

  const hasActiveFilters = !!filters.category || sortOption !== 'mais_vendidos';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Produtos</h1>
          <p className="text-muted-foreground">
            {loading ? 'Carregando...' : `${total} produto${total !== 1 ? 's' : ''} encontrado${total !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button
          onClick={handleCreateProduct}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Novo Produto
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar produtos..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="h-10 w-full rounded-lg border border-input bg-background pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                showFilters || hasActiveFilters
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-input bg-background hover:bg-accent'
              )}
            >
              <Filter className="h-4 w-4" />
              Filtros
              {hasActiveFilters && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                  {[!!filters.category, sortOption !== 'nome_asc'].filter(Boolean).length}
                </span>
              )}
            </button>

            <div className="flex rounded-lg border border-input bg-background p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'rounded-md p-2 transition-colors',
                  viewMode === 'grid'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Grid3X3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={cn(
                  'rounded-md p-2 transition-colors',
                  viewMode === 'table'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Expanded Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="grid gap-4 border-t border-border pt-4 sm:grid-cols-2 lg:grid-cols-3">
                {/* Category */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Categoria</label>
                  <select
                    value={filters.category}
                    onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">Todas</option>
                    {categorias.map((cat) => (
                      <option key={cat.nome} value={cat.nome}>
                        {cat.nome}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sort */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Ordenar por</label>
                  <div className="flex gap-2">
                    <select
                      value={sortOption}
                      onChange={(e) => setSortOption(e.target.value)}
                      className="h-10 flex-1 rounded-lg border border-input bg-background px-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      {sortOptions.map((opt) => (
                        <option key={opt.apiValue} value={opt.apiValue}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="flex h-10 w-10 items-center justify-center rounded-lg border border-input bg-background hover:bg-accent"
                      title="Ordenação"
                    >
                      <ArrowUpDown className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {hasActiveFilters && (
                <div className="mt-4 flex items-center justify-end">
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                    Limpar filtros
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Products List */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <p className="font-medium text-destructive">{error}</p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {products.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-16"
            >
              <div className="rounded-full bg-muted p-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">Nenhum produto encontrado</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Tente ajustar os filtros ou criar um novo produto
              </p>
              <button
                onClick={handleCreateProduct}
                className="mt-4 flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                <Plus className="h-4 w-4" />
                Novo Produto
              </button>
            </motion.div>
          ) : viewMode === 'grid' ? (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            >
              {products.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <ProductCard
                    product={product}
                    imageUrl={categoryImageMap[product.category]}
                    onView={handleViewProduct}
                    onEdit={handleEditProduct}
                    onDelete={handleDeleteProduct}
                  />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="table"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ProductTable
                products={products}
                onView={handleViewProduct}
                onEdit={handleEditProduct}
                onDelete={handleDeleteProduct}
              />
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Pagination */}
      {!loading && !error && pages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Página {page} de {pages}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-input bg-background disabled:opacity-40 hover:bg-accent"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              disabled={page >= pages}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-input bg-background disabled:opacity-40 hover:bg-accent"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <ProductModal
        product={selectedProduct}
        isOpen={showProductModal}
        onClose={() => {
          setShowProductModal(false);
          setSelectedProduct(null);
        }}
      />

      <ProductFormModal
        product={editingProduct}
        isOpen={showFormModal}
        onClose={() => {
          setShowFormModal(false);
          setEditingProduct(null);
        }}
        onSave={handleSaveProduct}
        categorias={categorias}
      />

      <DeleteConfirmModal
        isOpen={showDeleteModal}
        productName={deletingProduct?.name ?? ''}
        onClose={() => {
          setShowDeleteModal(false);
          setDeletingProduct(null);
        }}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
