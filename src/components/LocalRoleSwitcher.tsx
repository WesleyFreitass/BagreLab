import React from 'react';
import { AuthUser } from '../lib/types';
import { MAKER_EMAIL } from '../lib/api';
import { TabType } from './Navbar';
import { Wrench, User, LogOut } from 'lucide-react';

interface LocalRoleSwitcherProps {
  currentUser: AuthUser;
  onSwitchUser: (user: AuthUser) => void;
  setActiveTab: (tab: TabType) => void;
}

export const MOCK_LOCAL_MAKER: AuthUser = {
  id: 'maker-wesley',
  name: 'Wesley Freitas (Maker)',
  email: MAKER_EMAIL,
  phone: '47999999999',
  role: 'maker',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
};

export const MOCK_LOCAL_CLIENT: AuthUser = {
  id: 'client-test',
  name: 'Cliente Teste',
  email: 'cliente.teste@bagrelab.com',
  phone: '47988888888',
  role: 'client',
};

export const MOCK_GUEST_USER: AuthUser = {
  id: '',
  name: 'Visitante',
  email: '',
  phone: '',
  role: 'client',
};

// Check if current runtime is strictly local (localhost / 127.0.0.1 / Vite dev)
export function isLocalEnvironment(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '0.0.0.0' ||
    host.endsWith('.local') ||
    Boolean(import.meta.env?.DEV)
  );
}

export const LocalRoleSwitcher: React.FC<LocalRoleSwitcherProps> = ({
  currentUser,
  onSwitchUser,
  setActiveTab,
}) => {
  if (!isLocalEnvironment()) {
    return null; // Strictest safeguard: never rendered on VPS/production
  }

  const isMaker = currentUser.role === 'maker';
  const isClient = currentUser.email && currentUser.role === 'client';
  const isGuest = !currentUser.email;

  const handleSetMaker = () => {
    onSwitchUser(MOCK_LOCAL_MAKER);
    setActiveTab('client_requests');
  };

  const handleSetClient = () => {
    onSwitchUser(MOCK_LOCAL_CLIENT);
    setActiveTab('makerworld');
  };

  const handleSetGuest = () => {
    onSwitchUser(MOCK_GUEST_USER);
    setActiveTab('home');
  };

  return (
    <aside aria-label="Controle de ambiente de teste local" className="fixed bottom-4 right-4 z-50 no-print select-none">
      <div className="bg-[#DFD6C5] border-2 border-[#5A4E40] rounded-xl shadow-xl p-2.5 flex items-center gap-2 font-mono-tech text-xs">
        
        {/* Label Badge */}
        <div className="flex items-center gap-1.5 px-2 py-1 bg-[#221E1B] text-[#EAE5D9] rounded font-bold text-[10px] tracking-wider uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>DEV LOCAL:</span>
        </div>

        {/* Maker Button */}
        <button
          type="button"
          onClick={handleSetMaker}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded font-bold transition-all cursor-pointer ${
            isMaker
              ? 'bg-[#1E3E24] text-[#F6F3EC] shadow-inner border border-[#112615]'
              : 'bg-[#EFECE4] text-[#221E1B] hover:bg-[#F6F3EC] border border-[#8E8070]'
          }`}
          title="Alternar para visão de Maker (Wesley: Solicitações, Custos, Filamentos, Baixa de Pagamento)"
        >
          <Wrench className="w-3.5 h-3.5" />
          <span>Maker</span>
        </button>

        {/* Client Button */}
        <button
          type="button"
          onClick={handleSetClient}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded font-bold transition-all cursor-pointer ${
            isClient
              ? 'bg-[#1E3E24] text-[#F6F3EC] shadow-inner border border-[#112615]'
              : 'bg-[#EFECE4] text-[#221E1B] hover:bg-[#F6F3EC] border border-[#8E8070]'
          }`}
          title="Alternar para visão de Cliente Logado (Orçador MakerWorld, Minhas Solicitações)"
        >
          <User className="w-3.5 h-3.5" />
          <span>Cliente</span>
        </button>

        {/* Guest Button */}
        <button
          type="button"
          onClick={handleSetGuest}
          className={`flex items-center gap-1 px-2 py-1.5 rounded text-[11px] font-medium transition-all cursor-pointer ${
            isGuest
              ? 'bg-[#5C5349] text-[#F6F3EC] border border-[#3A3128]'
              : 'bg-[#EFECE4] text-[#5C5349] hover:bg-[#F6F3EC] border border-[#8E8070]'
          }`}
          title="Alternar para visão de Visitante Deslogado"
        >
          <LogOut className="w-3 h-3" />
          <span>Visitante</span>
        </button>

      </div>
    </aside>
  );
};
