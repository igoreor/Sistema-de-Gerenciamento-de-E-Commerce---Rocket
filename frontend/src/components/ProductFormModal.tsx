import { X, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Product } from '@/types';
import { CategoriaResponse } from '@/services/api';

interface ProductFormModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    nome_produto: string;
    categoria_produto: string;
    peso_produto_gramas: number | null;
    comprimento_centimetros: number | null;
    altura_centimetros: number | null;
    largura_centimetros: number | null;
  }) => void;
  categorias: CategoriaResponse[];
}

interface FormData {
  nome_produto: string;
  categoria_produto: string;
  peso_produto_gramas: string;
  comprimento_centimetros: string;
  altura_centimetros: string;
  largura_centimetros: string;
}

const emptyForm: FormData = {
  nome_produto: '',
  categoria_produto: '',
  peso_produto_gramas: '',
  comprimento_centimetros: '',
  altura_centimetros: '',
  largura_centimetros: '',
};

export function ProductFormModal({
  product,
  isOpen,
  onClose,
  onSave,
  categorias,
}: ProductFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (product) {
      setFormData({
        nome_produto: product.name,
        categoria_produto: product.category,
        peso_produto_gramas: product.peso !== null && product.peso !== undefined ? String(product.peso) : '',
        comprimento_centimetros: product.comprimento !== null && product.comprimento !== undefined ? String(product.comprimento) : '',
        altura_centimetros: product.altura !== null && product.altura !== undefined ? String(product.altura) : '',
        largura_centimetros: product.largura !== null && product.largura !== undefined ? String(product.largura) : '',
      });
    } else {
      setFormData(emptyForm);
    }
    setErrors({});
  }, [product, isOpen]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.nome_produto.trim()) newErrors.nome_produto = 'Nome é obrigatório';
    if (!formData.categoria_produto) newErrors.categoria_produto = 'Categoria é obrigatória';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const parseOptionalFloat = (v: string) => {
    const n = parseFloat(v);
    return v.trim() === '' || isNaN(n) ? null : n;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      await onSave({
        nome_produto: formData.nome_produto.trim(),
        categoria_produto: formData.categoria_produto,
        peso_produto_gramas: parseOptionalFloat(formData.peso_produto_gramas),
        comprimento_centimetros: parseOptionalFloat(formData.comprimento_centimetros),
        altura_centimetros: parseOptionalFloat(formData.altura_centimetros),
        largura_centimetros: parseOptionalFloat(formData.largura_centimetros),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const field = (label: string, key: keyof FormData, type = 'text') => (
    <div>
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      <input
        type={type}
        step={type === 'number' ? '0.01' : undefined}
        min={type === 'number' ? '0' : undefined}
        value={formData[key]}
        onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
        className={`h-11 w-full rounded-lg border bg-background px-4 text-sm focus:outline-none focus:ring-1 ${
          errors[key]
            ? 'border-destructive focus:border-destructive focus:ring-destructive'
            : 'border-input focus:border-primary focus:ring-primary'
        }`}
      />
      {errors[key] && <p className="mt-1 text-sm text-destructive">{errors[key]}</p>}
    </div>
  );

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
            className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-xl font-semibold">
                {product ? 'Editar Produto' : 'Novo Produto'}
              </h2>
              <button onClick={onClose} className="rounded-lg p-2 hover:bg-accent">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
              <div className="space-y-5">
                {field('Nome do Produto *', 'nome_produto')}

                {/* Category select */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium">Categoria *</label>
                  <select
                    value={formData.categoria_produto}
                    onChange={(e) =>
                      setFormData({ ...formData, categoria_produto: e.target.value })
                    }
                    className={`h-11 w-full rounded-lg border bg-background px-4 text-sm focus:outline-none focus:ring-1 ${
                      errors.categoria_produto
                        ? 'border-destructive focus:border-destructive focus:ring-destructive'
                        : 'border-input focus:border-primary focus:ring-primary'
                    }`}
                  >
                    <option value="">Selecione...</option>
                    {categorias.map((cat) => (
                      <option key={cat.nome} value={cat.nome}>
                        {cat.nome}
                      </option>
                    ))}
                  </select>
                  {errors.categoria_produto && (
                    <p className="mt-1 text-sm text-destructive">{errors.categoria_produto}</p>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {field('Peso (g)', 'peso_produto_gramas', 'number')}
                  {field('Comprimento (cm)', 'comprimento_centimetros', 'number')}
                  {field('Altura (cm)', 'altura_centimetros', 'number')}
                  {field('Largura (cm)', 'largura_centimetros', 'number')}
                </div>
              </div>
            </form>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
              <button
                type="button"
                onClick={onClose}
                className="h-10 rounded-lg border border-input bg-background px-4 text-sm font-medium hover:bg-accent"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {product ? 'Salvar Alterações' : 'Criar Produto'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
