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
    <header className="relative z-20 bg-[#E6E0D2] border-b-2 border-[#7E7162] no-print">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        
        {/* Logo */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setActiveTab(isLoggedIn ? (isMaker ? 'client_requests' : 'makerworld') : 'home')}
            className="flex items-center gap-3 group cursor-pointer text-left"
          >
            <img
              src="/bagre-foco-silhueta-preto-transparente.png"
              alt="BagreLab Ícone"
              className="h-12 sm:h-13 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
            />
            <span
              style={{ fontFamily: "'Unbounded', sans-serif" }}
              className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#221E1B]"
            >
              BagreLab
            </span>
          </button>
        </div>

        {/* Navegação Principal */}
        <nav className="flex items-center h-full space-x-1 sm:space-x-3">
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
        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 font-mono-tech text-xs sm:text-sm font-semibold text-[#221E1B] bg-[#DFD6C5] px-3 py-1.5 rounded border border-[#8E8070] cursor-pointer hover:bg-[#D5CBB8] transition-colors"
              >
                <span className="w-2 h-2 rounded-full bg-[#1E3E24]"></span>
                <span className="truncate max-w-[130px]">
                  {currentUser.name ? `${currentUser.name.split(' ')[0]} / @bagre` : 'Wesley / @bagre'}
                </span>
                <span className="text-[10px]">▼</span>
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 paper-card p-3 z-50 text-xs space-y-2">
                  <div className="border-b border-[#D5CBB8] pb-2">
                    <div className="font-heading font-bold text-sm text-[#221E1B]">{currentUser.name}</div>
                    <div className="font-mono-tech text-[11px] text-[#5C5349]">{currentUser.email}</div>
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
              className="flex items-center gap-2 font-mono-tech text-xs sm:text-sm font-semibold text-[#221E1B] bg-[#DFD6C5] px-3 py-1.5 rounded border border-[#8E8070] cursor-pointer hover:bg-[#D5CBB8] transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-[#5C5349]"></span>
              <span>Login / @bagre</span>
              <span className="text-[10px]">▼</span>
            </button>
          )}
        </div>

      </div>

      {/* Sub-barra de Módulos da Oficina do Maker (Posicionada exatamente no local indicado, estilo ficha técnica) */}
      {isMaker && (
        <div className="bg-[#DFD6C5] border-t border-[#C8BFA8] px-4 sm:px-6 py-2 shadow-inner">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-3 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="font-mono-tech text-[10px] font-bold uppercase tracking-wider text-[#4A4239] flex items-center gap-1.5 bg-[#D5CBB8] px-2.5 py-1 rounded border border-[#A0988A]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1E3E24] animate-pulse" />
                OFICINA // MAKER:
              </span>
            </div>

            <nav className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
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
  );
};
