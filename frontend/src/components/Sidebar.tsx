import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  BarChart3,
  Settings,
  Store
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Package, label: 'Produtos', path: '/products' },
  { icon: ShoppingCart, label: 'Pedidos', path: '/orders' },
  { icon: Users, label: 'Clientes', path: '/customers', disabled: true },
  { icon: Settings, label: 'Configurações', path: '/settings', disabled: true },
];

export function Sidebar() {
  return (
    <aside className="hidden w-64 flex-col border-r border-border bg-card lg:flex">
      <div className="flex h-16 items-center gap-2 border-b border-border px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Store className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="text-lg font-semibold">RocketDash</span>
      </div>
      
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.disabled ? '#' : item.path}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive && !item.disabled
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                item.disabled && 'pointer-events-none opacity-50'
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-border p-4">
        <div className="rounded-lg bg-muted/50 p-4">
          <p className="text-xs font-medium text-muted-foreground">🚀 RocketLab</p>
          <p className="mt-1 text-sm font-semibold">Processo Seletivo</p>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full w-[47%] rounded-full bg-primary" />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">47% concluído — quase lá... talvez</p>
        </div>
      </div>
    </aside>
  );
}
