import { Bell, Search, Moon, Sun, Menu } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { cn } from '@/lib/utils';

export function Header() {
  const { theme, setTheme } = useTheme();

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
      <div className="flex items-center gap-4">
        <button className="rounded-lg p-2 hover:bg-accent lg:hidden">
          <Menu className="h-5 w-5" />
        </button>
        
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar produtos, pedidos..."
            className="h-10 w-80 rounded-lg border border-input bg-background pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="relative rounded-lg p-2 hover:bg-accent"
        >
          <Sun className={cn(
            "h-5 w-5 transition-all",
            theme === 'dark' ? "rotate-0 scale-100" : "rotate-90 scale-0"
          )} />
          <Moon className={cn(
            "absolute left-2 top-2 h-5 w-5 transition-all",
            theme === 'dark' ? "-rotate-90 scale-0" : "rotate-0 scale-100"
          )} />
        </button>

        <button className="relative rounded-lg p-2 hover:bg-accent">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
        </button>

        <div className="ml-2 flex items-center gap-3">
          <img
            src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face"
            alt="User avatar"
            className="h-9 w-9 rounded-full object-cover ring-2 ring-border"
          />
          <div className="hidden flex-col md:flex">
            <span className="text-sm font-medium">João Silva</span>
            <span className="text-xs text-muted-foreground">Admin</span>
          </div>
        </div>
      </div>
    </header>
  );
}
