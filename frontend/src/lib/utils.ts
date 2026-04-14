import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateString));
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value);
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'active':
      return 'bg-success/10 text-success';
    case 'inactive':
      return 'bg-muted text-muted-foreground';
    case 'out_of_stock':
      return 'bg-destructive/10 text-destructive';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case 'active':
      return 'Ativo';
    case 'inactive':
      return 'Inativo';
    case 'out_of_stock':
      return 'Sem Estoque';
    default:
      return status;
  }
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}
