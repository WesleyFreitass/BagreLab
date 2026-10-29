import React from 'react';
import {
  Calculator,
  Sparkles,
  Users,
  Printer as PrinterIcon,
  Layers,
  Settings,
  FileText,
  Database,
  Wifi,
  Inbox,
  Package,
  LogIn,
  LogOut,
  RefreshCw,
  Phone,
} from 'lucide-react';
import { AuthUser } from '../lib/types';

export type TabType =
  | 'calculator'
  | 'makerworld'
  | 'client_requests'
  | 'customers'
  | 'printers'
  | 'materials'
  | 'settings'
  | 'quotes'
  | 'my_requests';

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  isBackendConnected: boolean;
  currentUser: AuthUser;
  pendingRequestsCount?: number;
  onToggleRole: () => void;
  onOpenAuthModal: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isBackendConnected,
  currentUser,
  pendingRequestsCount = 0,
  onToggleRole,
  onOpenAuthModal,
  onLogout,
}) => {
  const isMaker = currentUser.role === 'maker';

  // Navigation tabs depending on active role
  const makerTabs = [
    {
      id: 'client_requests' as TabType,
      label: 'Solicitações',
      icon: Inbox,
      badge: pendingRequestsCount,
    },
    { id: 'calculator' as TabType, label: 'Calculadora', icon: Calculator },
    { id: 'makerworld' as TabType, label: 'MakerWorld', icon: Sparkles },
    { id: 'customers' as TabType, label: 'Clientes', icon: Users },
    { id: 'printers' as TabType, label: 'Impressoras', icon: PrinterIcon },
    { id: 'materials' as TabType, label: 'Filamentos', icon: Layers },
    { id: 'settings' as TabType, label: 'Oficina', icon: Settings },
    { id: 'quotes' as TabType, label: 'Histórico', icon: FileText },
  ];

  const clientTabs = [
    { id: 'makerworld' as TabType, label: 'Orçar no MakerWorld', icon: Sparkles },
    { id: 'my_requests' as TabType, label: 'Minhas Solicitações', icon: Package },
  ];

  const visibleTabs = isMaker ? makerTabs : clientTabs;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs no-print">
      {/* Top Bar: Brand + User Actions (Never collides with tabs) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-2.5 shrink-0">
            <img
              src="/bagrelab-logo.png"
              alt="BagreLab"
              className="w-10 h-10 object-contain select-none"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black text-slate-900 tracking-tight leading-none">BagreLab</span>
              </div>
              <span className="text-[10px] text-slate-500 hidden sm:block mt-0.5">
                {isMaker ? 'Gestão de Custos & Precificação 3D' : 'Orçamentos Automáticos de Impressão 3D'}
              </span>
            </div>
          </div>

          {/* Right Area: Role Switcher & User Profile */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Role Switcher Toggle */}
            <button
              onClick={onToggleRole}
              title={`Alternar para ${isMaker ? 'Visão do Cliente' : 'Visão do Maker'}`}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer shadow-2xs ${
                isMaker
                  ? 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
                  : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{isMaker ? 'Simular Cliente' : 'Modo Maker'}</span>
            </button>

            {/* User Profile / Auth State */}
            {currentUser.email ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                {currentUser.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.name}
                    className="w-7 h-7 rounded-full border border-slate-200 object-cover"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                )}
                
                <div className="hidden md:block text-left">
                  <div className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[120px]">
                    {currentUser.name}
                  </div>
                  {currentUser.phone && (
                    <div className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                      <Phone className="w-2.5 h-2.5 text-emerald-600" />
                      <span>{currentUser.phone}</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={onLogout}
                  title="Sair / Trocar Conta"
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuthModal}
                className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-3 py-1.5 rounded-lg shadow-2xs transition-colors cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Entrar</span>
              </button>
            )}

            {/* Backend connectivity indicator */}
            <div
              className={`p-1.5 rounded-full border hidden sm:block ${
                isBackendConnected
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
              title={
                isBackendConnected
                  ? 'Conectado ao Backend Express + MongoDB'
                  : 'Modo Offline: Armazenamento Local'
              }
            >
              {isBackendConnected ? (
                <Wifi className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Database className="w-3.5 h-3.5 text-amber-600" />
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Dedicated Navigation Bar: Clean row with zero chance of overlapping */}
      <div className="border-t border-slate-100 bg-slate-50/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-1 py-1 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {visibleTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const badge = (tab as any).badge;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-white text-blue-600 shadow-2xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                  {typeof badge === 'number' && badge > 0 && (
                    <span className="ml-0.5 bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full animate-pulse">
                      {badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};
