import React from 'react';
import { MessageSquare, Search, Settings, BookOpen } from 'lucide-react';
import { ROUTES, APP_NAME } from '../constants';

interface LayoutProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ currentRoute, onNavigate, children }) => {
  const navItems = [
    { id: ROUTES.CHAT, label: 'Chat Assistant', icon: MessageSquare },
    { id: ROUTES.SEARCH, label: 'Deep Search', icon: Search },
    { id: ROUTES.SETTINGS, label: 'System Status', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shadow-xl flex-shrink-0">
        <div className="p-6 flex items-center space-x-3 text-white border-b border-slate-800">
          <BookOpen className="w-6 h-6 text-emerald-400" />
          <span className="text-xl font-bold tracking-tight">{APP_NAME}</span>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentRoute === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                  isActive 
                    ? 'bg-emerald-600 text-white shadow-md' 
                    : 'hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-emerald-400'}`} />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 text-xs text-slate-500 text-center">
          Running on Llama 3.2 <br /> & Hybrid RAG
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {children}
      </main>
    </div>
  );
};