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
  Inbox,
  Package,
  LogIn,
  LogOut,
  Phone,
  Home,
} from 'lucide-react';
import { AuthUser } from '../lib/types';

export type TabType =
  | 'home'
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
  onOpenAuthModal: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isBackendConnected,
  currentUser,
  pendingRequestsCount = 0,
  onOpenAuthModal,
  onLogout,
}) => {
  const isMaker = currentUser.role === 'maker';
  const isLoggedIn = Boolean(currentUser.email);

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
    <header className="relative bg-gradient-to-r from-[#091b2c] via-[#102a45] to-[#183959] text-white border-b border-[#1b3e64] sticky top-0 z-30 shadow-md no-print overflow-hidden">
      
      {/* Oceanic ripples and wave background decoration */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-20 select-none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        viewBox="0 0 1200 120"
      >
        <path
          d="M0,0 C150,80 350,-40 500,40 C650,110 900,10 1200,50 L1200,0 L0,0 Z"
          fill="rgba(255,255,255,0.08)"
        />
        <path
          d="M0,35 C300,110 600,0 900,65 C1050,100 1150,45 1200,75 L1200,120 L0,120 Z"
          fill="rgba(255,255,255,0.05)"
        />
        <circle cx="70" cy="30" r="3.5" fill="rgba(255,255,255,0.18)" />
        <circle cx="210" cy="75" r="2.5" fill="rgba(255,255,255,0.14)" />
        <circle cx="580" cy="20" r="4" fill="rgba(255,255,255,0.12)" />
        <circle cx="850" cy="85" r="2" fill="rgba(255,255,255,0.15)" />
        <circle cx="1050" cy="40" r="3.5" fill="rgba(255,255,255,0.15)" />
      </svg>

      {/* Top Bar: Brand + User Profile + Cloud Status */}
      <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div
            onClick={() => {
              if (!isLoggedIn) setActiveTab('home');
              else if (isMaker) setActiveTab('client_requests');
              else setActiveTab('makerworld');
            }}
            className="flex items-center gap-2.5 sm:gap-3 shrink-0 cursor-pointer group"
          >
            <div className="relative">
              <img
                src="/bagrelab-logo.png"
                alt="BagreLab"
                className="w-10 h-10 sm:w-11 sm:h-11 object-contain select-none rounded-xl ring-1 ring-white/20 shadow-sm transition-transform group-hover:scale-105"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-base sm:text-lg font-black text-white tracking-tight leading-none drop-shadow-xs">
                  BagreLab
                </span>
                {isMaker && (
                  <span className="bg-blue-500/20 text-blue-200 border border-blue-400/30 text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                    Maker
                  </span>
                )}
              </div>
              <span className="text-[10px] sm:text-[11px] text-blue-200/80 hidden xs:block mt-0.5 font-normal">
                {isMaker ? 'Gestão & Precificação 3D' : 'Orçamentos Automáticos de Impressão 3D'}
              </span>
            </div>
          </div>

          {/* Right Area: User Profile, Login Button & Cloud Status */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            
            {/* Cloud Status Indicator */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] sm:text-[11px] font-medium backdrop-blur-xs transition-colors ${
                isBackendConnected
                  ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40 shadow-xs'
                  : 'bg-amber-950/70 text-amber-300 border-amber-500/40'
              }`}
              title={
                isBackendConnected
                  ? 'Conectado à nuvem VPS (MongoDB Ativo)'
                  : 'Modo Offline: Armazenamento Local'
              }
            >
              {isBackendConnected ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="hidden sm:inline">Nuvem Ativa</span>
                </>
              ) : (
                <>
                  <Database className="w-3 h-3 text-amber-400" />
                  <span className="hidden sm:inline">Modo Local</span>
                </>
              )}
            </div>

            {/* User Profile / Auth State */}
            {isLoggedIn ? (
              <div className="flex items-center gap-2 sm:gap-2.5 pl-2 border-l border-white/15">
                {currentUser.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.name}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-white/30 object-cover ring-1 ring-blue-400/20"
                  />
                ) : (
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-500/30 text-blue-100 flex items-center justify-center font-bold text-xs border border-white/20">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                )}
                
                <div className="hidden md:block text-left">
                  <div className="text-xs font-bold text-white leading-tight truncate max-w-[130px]">
                    {currentUser.name}
                  </div>
                  {currentUser.phone && (
                    <div className="text-[10px] font-mono text-emerald-300 flex items-center gap-1">
                      <Phone className="w-2.5 h-2.5 text-emerald-400" />
                      <span>{currentUser.phone}</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={onLogout}
                  title="Sair / Trocar Conta"
                  className="p-1.5 text-blue-200/80 hover:text-rose-300 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuthModal}
                className="inline-flex items-center gap-1.5 sm:gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-3 sm:px-4 py-2 rounded-lg shadow-sm transition-all cursor-pointer ring-1 ring-white/20"
              >
                <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Entrar com Google</span>
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Navigation Bar for Logged-In Users (Maker or Client) */}
      {isLoggedIn && (
        <div className="relative z-10 border-t border-white/10 bg-[#071524]/90 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
            <nav className="flex items-center gap-1 py-1.5 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              
              {/* Optional Home button */}
              <button
                onClick={() => setActiveTab('home')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  activeTab === 'home'
                    ? 'bg-blue-600 text-white font-bold shadow-xs ring-1 ring-blue-400/40'
                    : 'text-blue-200/70 hover:text-white hover:bg-white/10'
                }`}
                title="Página Inicial"
              >
                <Home className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Início</span>
              </button>

              {visibleTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                const badge = (tab as any).badge;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                      isActive
                        ? 'bg-blue-600 text-white font-bold shadow-xs ring-1 ring-blue-400/40'
                        : 'text-blue-200/70 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-blue-300/70'}`} />
                    <span>{tab.label}</span>
                    {typeof badge === 'number' && badge > 0 && (
                      <span className="ml-1 bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full animate-pulse shadow-xs">
                        {badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};
