import React, { useState } from 'react';
import {
  Calculator,
  Users,
  Printer as PrinterIcon,
  Layers,
  Settings,
  FileText,
  Inbox,
  Package,
  LogOut,
  Home,
  Zap,
  X,
  User,
  Wrench,
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
  onSwitchUser?: (user: AuthUser) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  pendingRequestsCount = 0,
  onOpenAuthModal,
  onLogout,
}) => {
  const isMaker = currentUser.role === 'maker';
  const isLoggedIn = Boolean(currentUser.email);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMakerDrawerOpen, setIsMakerDrawerOpen] = useState(false);

  const makerSubTabs = [
    { id: 'client_requests' as TabType, label: 'Solicitações (Inbox)', icon: Inbox, badge: pendingRequestsCount },
    { id: 'calculator' as TabType, label: 'Calculadora DRE', icon: Calculator },
    { id: 'materials' as TabType, label: 'Estoque Filamentos', icon: Layers },
    { id: 'printers' as TabType, label: 'Impressoras', icon: PrinterIcon },
    { id: 'customers' as TabType, label: 'Clientes', icon: Users },
    { id: 'settings' as TabType, label: 'Configurações', icon: Settings },
    { id: 'quotes' as TabType, label: 'Histórico', icon: FileText },
  ];

  return (
    <>
      <header className="relative z-20 bg-[#E6E0D2] border-b-2 border-[#7E7162] no-print w-full">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab(isLoggedIn ? (isMaker ? 'client_requests' : 'makerworld') : 'home')}
              className="flex items-center gap-2 sm:gap-3 group cursor-pointer text-left"
            >
              <img
                src="/bagre-foco-silhueta-preto-transparente.png"
                alt="BagreLab Ícone"
                className="h-10 sm:h-13 w-auto object-contain transition-transform duration-200 group-hover:scale-105 shrink-0"
              />
              <span
                style={{ fontFamily: "'Unbounded', sans-serif" }}
                className="text-lg sm:text-2xl font-extrabold tracking-tight text-[#221E1B]"
              >
                BagreLab
              </span>
            </button>
          </div>

          {/* Navegação Principal (Oculta no Mobile, visível no Desktop) */}
          <nav className="hidden md:flex items-center h-full space-x-1 sm:space-x-3">
            {/* Início */}
            <button
              type="button"
              onClick={() => setActiveTab('home')}
              className={`px-3 py-1.5 rounded-md text-sm sm:text-base cursor-pointer transition-colors ${
                activeTab === 'home'
                  ? 'font-bold text-[#1E3E24] bg-[#DFD6C5]'
                  : 'font-medium text-[#5C5349] hover:text-[#221E1B] hover:bg-[#DFD6C5]/40'
              }`}
            >
              Início
            </button>

            {/* Orçar no MakerWorld */}
            <button
              type="button"
              onClick={() => setActiveTab('makerworld')}
              className={`px-3 py-1.5 rounded-md text-sm sm:text-base cursor-pointer transition-colors ${
                activeTab === 'makerworld'
                  ? 'font-bold text-[#1E3E24] bg-[#DFD6C5]'
                  : 'font-medium text-[#5C5349] hover:text-[#221E1B] hover:bg-[#DFD6C5]/40'
              }`}
            >
              Orçar no MakerWorld
            </button>

            {/* Minhas Solicitações */}
            <button
              type="button"
              onClick={() => {
                if (!isLoggedIn) onOpenAuthModal();
                else setActiveTab('my_requests');
              }}
              className={`px-3 py-1.5 rounded-md text-sm sm:text-base cursor-pointer transition-colors ${
                activeTab === 'my_requests'
                  ? 'font-bold text-[#1E3E24] bg-[#DFD6C5]'
                  : 'font-medium text-[#5C5349] hover:text-[#221E1B] hover:bg-[#DFD6C5]/40'
              }`}
            >
              Minhas Solicitações
            </button>
          </nav>

          {/* Perfil / Login */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {isLoggedIn ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-1.5 sm:gap-2 font-mono-tech text-xs sm:text-sm font-semibold text-[#221E1B] bg-[#DFD6C5] px-2.5 py-1.5 rounded border border-[#8E8070] cursor-pointer hover:bg-[#D5CBB8] transition-colors"
                >
                  <span className="w-2 h-2 rounded-full bg-[#1E3E24]"></span>
                  <span className="truncate max-w-[80px] sm:max-w-[130px]">
                    {currentUser.name ? `${currentUser.name.split(' ')[0]} / @bagre` : 'Wesley / @bagre'}
                  </span>
                  <span className="text-[10px]">▼</span>
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 paper-card p-3 z-50 text-xs space-y-2 shadow-xl">
                    <div className="border-b border-[#D5CBB8] pb-2">
                      <div className="font-heading font-bold text-sm text-[#221E1B]">{currentUser.name}</div>
                      <div className="font-mono-tech text-[11px] text-[#5C5349] truncate">{currentUser.email}</div>
                      {currentUser.phone && (
                        <div className="font-mono-tech text-[11px] text-[#1E3E24] font-semibold mt-0.5">
                          {currentUser.phone}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('my_requests');
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-[#221E1B] hover:bg-[#EFECE4] text-left font-semibold cursor-pointer"
                    >
                      <Package className="w-3.5 h-3.5 text-[#1E3E24]" />
                      <span>Meus Pedidos</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onLogout();
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-rose-700 hover:bg-rose-100 text-left font-semibold cursor-pointer border-t border-[#D5CBB8] pt-2"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sair da Conta</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenAuthModal}
                className="flex items-center gap-1.5 sm:gap-2 font-mono-tech text-xs sm:text-sm font-semibold text-[#221E1B] bg-[#DFD6C5] px-2.5 sm:px-3 py-1.5 rounded border border-[#8E8070] cursor-pointer hover:bg-[#D5CBB8] transition-colors"
              >
                <span className="w-2 h-2 rounded-full bg-[#5C5349]"></span>
                <span>Login</span>
                <span className="text-[10px]">▼</span>
              </button>
            )}
          </div>

        </div>

        {/* Sub-barra de Módulos da Oficina do Maker (Desktop) */}
        {isMaker && (
          <div className="hidden md:block bg-[#DFD6C5] border-t border-[#C8BFA8] px-4 sm:px-6 py-2 shadow-inner">
            <div className="max-w-6xl mx-auto overflow-x-auto no-scrollbar">
              <nav className="flex items-center gap-1.5 sm:gap-2 no-scrollbar">
                {makerSubTabs.map((item) => {
                  const Icon = item.icon;
                  const isSel = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveTab(item.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded font-mono-tech text-xs transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                        isSel
                          ? 'bg-[#1E3E24] text-[#F6F3EC] font-bold shadow-inner border border-[#112615]'
                          : 'bg-[#EFECE4] text-[#3D352E] hover:bg-[#F6F3EC] hover:text-[#221E1B] border border-[#8E8070] font-semibold'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{item.label}</span>
                      {typeof item.badge === 'number' && item.badge > 0 && (
                        <span className="bg-rose-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full font-mono-tech">
                          {item.badge}
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

      {/* BARRA DE NAVEGAÇÃO INFERIOR PARA CELULARES (Bottom Nav Bar) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#E6E0D2] border-t-2 border-[#7E7162] px-2 py-1 flex items-center justify-around md:hidden shadow-[0_-4px_12px_rgba(0,0,0,0.1)] no-print">
        {/* Início */}
        <button
          type="button"
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center justify-center p-1.5 rounded-lg text-[10px] font-mono-tech transition-colors ${
            activeTab === 'home'
              ? 'text-[#1E3E24] font-bold'
              : 'text-[#5C5349] font-medium'
          }`}
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span>Início</span>
        </button>

        {/* Orçar MakerWorld */}
        <button
          type="button"
          onClick={() => setActiveTab('makerworld')}
          className={`flex flex-col items-center justify-center p-1.5 rounded-lg text-[10px] font-mono-tech transition-colors ${
            activeTab === 'makerworld'
              ? 'text-[#1E3E24] font-bold'
              : 'text-[#5C5349] font-medium'
          }`}
        >
          <Zap className="w-5 h-5 mb-0.5" />
          <span>Orçar</span>
        </button>

        {/* Meus Pedidos */}
        <button
          type="button"
          onClick={() => {
            if (!isLoggedIn) onOpenAuthModal();
            else setActiveTab('my_requests');
          }}
          className={`flex flex-col items-center justify-center p-1.5 rounded-lg text-[10px] font-mono-tech transition-colors ${
            activeTab === 'my_requests'
              ? 'text-[#1E3E24] font-bold'
              : 'text-[#5C5349] font-medium'
          }`}
        >
          <Package className="w-5 h-5 mb-0.5" />
          <span>Pedidos</span>
        </button>

        {/* Se for Maker: Inbox de Solicitações */}
        {isMaker && (
          <button
            type="button"
            onClick={() => setActiveTab('client_requests')}
            className={`flex flex-col items-center justify-center p-1.5 rounded-lg text-[10px] font-mono-tech relative transition-colors ${
              activeTab === 'client_requests'
                ? 'text-[#1E3E24] font-bold'
                : 'text-[#5C5349] font-medium'
            }`}
          >
            <Inbox className="w-5 h-5 mb-0.5" />
            <span>Inbox</span>
            {pendingRequestsCount > 0 && (
              <span className="absolute top-0.5 right-1 w-4 h-4 rounded-full bg-rose-600 text-white font-bold text-[9px] flex items-center justify-center">
                {pendingRequestsCount}
              </span>
            )}
          </button>
        )}

        {/* Se for Maker: Botão para abrir gaveta da Oficina */}
        {isMaker ? (
          <button
            type="button"
            onClick={() => setIsMakerDrawerOpen(true)}
            className="flex flex-col items-center justify-center p-1.5 rounded-lg text-[10px] font-mono-tech text-[#5C5349] font-medium"
          >
            <Wrench className="w-5 h-5 mb-0.5" />
            <span>Oficina</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              if (!isLoggedIn) onOpenAuthModal();
              else setIsUserMenuOpen(true);
            }}
            className="flex flex-col items-center justify-center p-1.5 rounded-lg text-[10px] font-mono-tech text-[#5C5349] font-medium"
          >
            <User className="w-5 h-5 mb-0.5" />
            <span>{isLoggedIn ? 'Conta' : 'Entrar'}</span>
          </button>
        )}
      </nav>

      {/* GAVETA / BOTTOM SHEET DA OFICINA NO CELULAR */}
      {isMaker && isMakerDrawerOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/50 backdrop-blur-xs md:hidden animate-in fade-in duration-200">
          <div className="bg-[#EAE5D9] border-t-2 border-[#7E7162] rounded-t-2xl p-4 space-y-3 shadow-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-[#C8BFA8]">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-[#1E3E24]" />
                <span className="font-heading font-bold text-sm text-[#221E1B]">Módulos da Oficina Maker</span>
              </div>
              <button
                type="button"
                onClick={() => setIsMakerDrawerOpen(false)}
                className="p-1 rounded-lg text-slate-500 hover:text-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 font-mono-tech text-xs">
              {makerSubTabs.map((item) => {
                const Icon = item.icon;
                const isSel = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsMakerDrawerOpen(false);
                    }}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-colors ${
                      isSel
                        ? 'bg-[#1E3E24] text-[#F6F3EC] border-[#112615] font-bold shadow-xs'
                        : 'bg-[#F6F3EC] text-[#221E1B] border-[#8E8070] font-medium hover:bg-[#DFD6C5]'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0 text-[#1E3E24]" />
                    <span className="truncate">{item.label}</span>
                    {typeof item.badge === 'number' && item.badge > 0 && (
                      <span className="ml-auto bg-rose-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
