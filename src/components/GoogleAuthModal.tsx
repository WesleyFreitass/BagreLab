import React, { useState } from 'react';
import { AuthUser } from '../lib/types';
import { X, Phone, CheckCircle2 } from 'lucide-react';

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: AuthUser) => void;
  title?: string;
  subtitle?: string;
}

export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  title = 'Identifique-se para Enviar seu Pedido',
  subtitle = 'Conecte sua conta do Google e informe seu WhatsApp para o Maker entrar em contato.',
}) => {
  const [step, setStep] = useState<'google' | 'phone'>('google');
  
  // Google mock/real profile state
  const [googleName, setGoogleName] = useState('Cliente');
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleAvatar, setGoogleAvatar] = useState(
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'
  );
  
  // Required WhatsApp with DDD
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');

  if (!isOpen) return null;

  const handleGoogleSignIn = (presetName?: string, presetEmail?: string) => {
    const finalName = presetName || prompt('Nome completo para identificação no Google:') || 'Cliente Google';
    const finalEmail = presetEmail || `${finalName.toLowerCase().replace(/\s+/g, '.')}@gmail.com`;
    
    setGoogleName(finalName);
    setGoogleEmail(finalEmail);
    setGoogleAvatar(`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(finalName)}`);
    setStep('phone');
  };

  const handleFinish = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, '');
    
    if (cleanPhone.length < 10) {
      setPhoneError('Por favor, digite o DDD + número de telefone (mínimo 10 dígitos).');
      return;
    }

    const newUser: AuthUser = {
      id: `client-${Date.now()}`,
      name: googleName,
      email: googleEmail,
      phone: cleanPhone,
      avatarUrl: googleAvatar,
      role: 'client',
      googleId: `goog_${Date.now()}`,
    };

    onSuccess(newUser);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900 text-base">{title}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step 1: Google Login */}
        {step === 'google' ? (
          <div className="space-y-4 py-2">
            <p className="text-xs text-slate-600 leading-relaxed">
              Para registrar seu orçamento e salvar seu histórico de peças impressas, faça login com a sua conta Google:
            </p>

            <button
              onClick={() => handleGoogleSignIn()}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-xs py-3 px-4 rounded-xl border border-slate-300 shadow-2xs transition-all cursor-pointer hover:border-slate-400"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continuar com o Google</span>
            </button>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-2 text-[10px] text-slate-400 uppercase font-semibold">
                ou acesso rápido de teste
              </span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleGoogleSignIn('Carlos Maker', 'carlos@exemplo.com')}
                className="p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left transition-colors cursor-pointer"
              >
                <strong className="block text-slate-800 text-[11px]">Carlos Maker</strong>
                <span className="text-[10px] text-slate-400 truncate block">carlos@exemplo.com</span>
              </button>

              <button
                type="button"
                onClick={() => handleGoogleSignIn('Mariana Souza', 'mariana@exemplo.com')}
                className="p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left transition-colors cursor-pointer"
              >
                <strong className="block text-slate-800 text-[11px]">Mariana Souza</strong>
                <span className="text-[10px] text-slate-400 truncate block">mariana@exemplo.com</span>
              </button>
            </div>
          </div>
        ) : (
          /* Step 2: Mandatory WhatsApp with DDD */
          <form onSubmit={handleFinish} className="space-y-4">
            {/* User card verified from Google */}
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <img
                src={googleAvatar}
                alt={googleName}
                className="w-10 h-10 rounded-full object-cover border border-slate-300"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <strong className="text-slate-900 truncate">{googleName}</strong>
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                </div>
                <span className="text-slate-500 text-[11px] truncate block">{googleEmail}</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-800 block mb-1">
                WhatsApp com DDD <span className="text-rose-500">* (Obrigatório)</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-emerald-600 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  required
                  autoFocus
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (phoneError) setPhoneError('');
                  }}
                  placeholder="Ex: 11999998888 ou 21988887777"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Necessário para o Maker enviar fotos da peça e confirmar a data de entrega.
              </p>
              {phoneError && (
                <p className="text-[11px] font-semibold text-rose-600 mt-1">{phoneError}</p>
              )}
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStep('google')}
                className="px-3.5 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium text-xs cursor-pointer"
              >
                Voltar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg shadow-2xs transition-colors cursor-pointer"
              >
                Concluir & Enviar Orçamento
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
