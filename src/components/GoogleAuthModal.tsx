import React, { useState, useEffect, useRef } from 'react';
import { AuthUser } from '../lib/types';
import { isUserMaker } from '../lib/api';
import { X, Phone, CheckCircle2 } from 'lucide-react';

declare global {
  interface Window {
    google?: any;
  }
}

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
  const googleBtnRef = useRef<HTMLDivElement>(null);
  
  // Profile state
  const [googleName, setGoogleName] = useState('Cliente');
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleAvatar, setGoogleAvatar] = useState(
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'
  );
  const [googleId, setGoogleId] = useState('');
  
  // Required WhatsApp with DDD
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');

  // Mount real Google Identity Services button
  useEffect(() => {
    if (!isOpen || step !== 'google') return;

    const clientId =
      import.meta.env.VITE_GOOGLE_CLIENT_ID ||
      '756102817401-do6khftagt4rf8tpa0odg9233r9v0940.apps.googleusercontent.com';

    const parseJwt = (token: string) => {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        return JSON.parse(jsonPayload);
      } catch {
        return null;
      }
    };

    const handleCredentialResponse = (response: any) => {
      if (response && response.credential) {
        const payload = parseJwt(response.credential);
        if (payload) {
          const finalName = payload.name || payload.given_name || 'Cliente Google';
          const finalEmail = payload.email || '';
          const finalAvatar = payload.picture || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(finalName)}`;
          const finalId = payload.sub || `goog_${Date.now()}`;

          setGoogleName(finalName);
          setGoogleEmail(finalEmail);
          setGoogleAvatar(finalAvatar);
          setGoogleId(finalId);
          setStep('phone');
        }
      }
    };

    const initGoogle = () => {
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: handleCredentialResponse,
            auto_select: false,
          });

          if (googleBtnRef.current) {
            googleBtnRef.current.innerHTML = '';
            window.google.accounts.id.renderButton(googleBtnRef.current, {
              theme: 'outline',
              size: 'large',
              type: 'standard',
              shape: 'rectangular',
              text: 'signin_with',
              logo_alignment: 'left',
              width: 320,
            });
          }
        } catch (e) {
          console.warn('Erro ao inicializar botão oficial do Google:', e);
        }
      }
    };

    // Retry if script hasn't loaded yet
    if (window.google?.accounts?.id) {
      initGoogle();
    } else {
      const timer = setTimeout(initGoogle, 600);
      return () => clearTimeout(timer);
    }
  }, [isOpen, step]);

  if (!isOpen) return null;

  const handleManualGoogleSignIn = (presetName?: string, presetEmail?: string) => {
    const finalName = presetName || prompt('Nome completo para identificação:') || 'Cliente Google';
    const finalEmail = presetEmail || `${finalName.toLowerCase().replace(/\s+/g, '.')}@gmail.com`;
    
    setGoogleName(finalName);
    setGoogleEmail(finalEmail);
    setGoogleAvatar(`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(finalName)}`);
    setGoogleId(`goog_${Date.now()}`);
    setStep('phone');
  };

  const handleFinish = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, '');
    
    if (cleanPhone.length < 10) {
      setPhoneError('Por favor, digite o DDD + número de telefone (mínimo 10 dígitos).');
      return;
    }

    const isMaker = isUserMaker(googleEmail);
    const newUser: AuthUser = {
      id: isMaker ? 'maker-wesley' : (googleId || `client-${Date.now()}`),
      name: googleName,
      email: googleEmail,
      phone: cleanPhone,
      avatarUrl: googleAvatar,
      role: isMaker ? 'maker' : 'client',
      googleId: googleId || `goog_${Date.now()}`,
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

        {step === 'google' ? (
          <div className="space-y-4 py-2 text-center">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-2">
              <svg className="w-6 h-6" viewBox="0 0 24 24">
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
            </div>

            <div>
              <h4 className="text-sm font-bold text-slate-800">Conecte-se com sua Conta Google</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Identificação rápida e segura para vincular suas peças e acompanhar os pedidos no BagreLab.
              </p>
            </div>

            {/* Official Google Identity Button Mount */}
            <div className="flex justify-center py-2 min-h-[44px]">
              <div ref={googleBtnRef} />
            </div>

            {/* Fallback button if Google script is blocked or offline */}
            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => handleManualGoogleSignIn()}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Entrar digitando nome / e-mail manualmente</span>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleFinish} className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <img
                src={googleAvatar}
                alt={googleName}
                className="w-10 h-10 rounded-full border border-slate-300 object-cover"
              />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-slate-900 truncate">{googleName}</div>
                <div className="text-[11px] text-slate-500 truncate">{googleEmail}</div>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Google</span>
              </span>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-800 block mb-1">
                WhatsApp com DDD <span className="text-rose-500">* (Obrigatório)</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  autoFocus
                  required
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setPhoneError('');
                  }}
                  placeholder="Ex: 11999998888 (com DDD)"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {phoneError ? (
                <span className="text-[11px] text-rose-600 mt-1 block font-medium">{phoneError}</span>
              ) : (
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Necessário para a oficina confirmar o modelo e enviar a proposta oficial.
                </span>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
            >
              Concluir Identificação e Enviar Pedido
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
