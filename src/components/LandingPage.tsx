import React from 'react';
import {
  Sparkles,
  Zap,
  Layers,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
  PhoneCall,
  Printer,
  CheckCircle,
} from 'lucide-react';
import { MakerWorldTab } from './MakerWorldTab';
import { Printer as PrinterType, Material, WorkshopSettings, AuthUser, SavedQuote } from '../lib/types';

interface LandingPageProps {
  printers: PrinterType[];
  materials: Material[];
  settings: WorkshopSettings;
  currentUser: AuthUser;
  onOpenLogin: () => void;
  onSubmitClientQuote?: (
    quoteData: Partial<SavedQuote>,
    decision: 'confirm_quote' | 'direct_print'
  ) => Promise<SavedQuote>;
  onNavigateToMyRequests?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  printers,
  materials,
  settings,
  currentUser,
  onOpenLogin,
  onSubmitClientQuote,
  onNavigateToMyRequests,
}) => {
  const scrollToQuoter = () => {
    const el = document.getElementById('orcador-instantaneo');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      const input = el.querySelector('input[type="url"]') as HTMLInputElement;
      if (input) setTimeout(() => input.focus(), 400);
    }
  };

  return (
    <div className="space-y-12 sm:space-y-16 pb-12">
      
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#0a1e33] via-[#102d4b] to-[#0e243d] text-white rounded-3xl p-6 sm:p-12 md:p-16 border border-[#1d436b] shadow-xl text-center">
        {/* Ambient background ripples */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -z-0" />

        <div className="relative z-10 max-w-3xl mx-auto space-y-6">
          
          {/* Logo with Glow */}
          <div className="inline-block relative">
            <div className="absolute inset-0 bg-blue-500/30 rounded-3xl blur-2xl transform scale-110" />
            <img
              src="/bagrelab-logo.png"
              alt="BagreLab Logo"
              className="w-24 h-24 sm:w-32 sm:h-32 object-contain mx-auto relative rounded-3xl shadow-2xl ring-2 ring-white/20"
            />
          </div>

          {/* Badge */}
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-semibold backdrop-blur-xs mb-3 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-blue-300" />
              <span>Plataforma Inteligente de Precificação 3D</span>
            </div>

            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-tight">
              BagreLab
            </h1>

            {/* ONE-SENTENCE PROJECT SUMMARY */}
            <p className="text-base sm:text-xl text-blue-100 font-medium mt-4 max-w-2xl mx-auto leading-relaxed">
              Calcule o orçamento exato da sua impressão 3D em segundos a partir de qualquer modelo do MakerWorld.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-3 max-w-md mx-auto">
            <button
              onClick={onOpenLogin}
              className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg hover:shadow-blue-500/30 transition-all cursor-pointer ring-1 ring-white/20 transform hover:-translate-y-0.5"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#ffffff"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#ffffff"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#ffffff"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#ffffff"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Entrar com Google</span>
            </button>

            <button
              onClick={scrollToQuoter}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-sm border border-white/20 backdrop-blur-xs transition-all cursor-pointer"
            >
              <span>Fazer Orçamento Rápido</span>
              <ArrowRight className="w-4 h-4 text-blue-300" />
            </button>
          </div>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 border-t border-white/10 text-left">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
              <Zap className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-white text-xs">Métricas Automáticas</strong>
                <span className="text-[11px] text-blue-200/80">Lê o fatiamento e tempos reais do MakerWorld.</span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
              <Layers className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-white text-xs">Estoque de Filamentos Volt</strong>
                <span className="text-[11px] text-blue-200/80">12 opções de cores em PLA, PETG e ABS.</span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-white text-xs">Envio Direto ao WhatsApp</strong>
                <span className="text-[11px] text-blue-200/80">Receba a confirmação do Maker em minutos.</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* INSTANT QUOTER SECTION (NO MIXING, CLEAN & DEDICATED) */}
      <section id="orcador-instantaneo" className="space-y-4">
        <div className="text-center max-w-xl mx-auto space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold">
            <Printer className="w-3.5 h-3.5" />
            <span>Simulador Interativo</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Orce sua Peça Agora
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Copie o link de qualquer modelo no MakerWorld e cole abaixo para calcular o valor de impressão.
          </p>
        </div>

        {/* Embedded Full MakerWorld Tab configured for Guest/Client usage */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 sm:p-6 shadow-xs">
          <MakerWorldTab
            printers={printers}
            materials={materials}
            settings={settings}
            currentUser={currentUser}
            onRequireAuth={onOpenLogin}
            onSubmitClientQuote={onSubmitClientQuote}
            onNavigateToMyRequests={onNavigateToMyRequests}
          />
        </div>
      </section>

      {/* HOW IT WORKS / 3-STEP EXPLANATION */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 shadow-xs space-y-6">
        <div className="text-center max-w-md mx-auto">
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900">Como funciona o BagreLab?</h3>
          <p className="text-xs text-slate-500 mt-1">Três passos simples para transformar o modelo 3D em realidade.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-black text-sm flex items-center justify-center">
              1
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Escolha no MakerWorld</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Navegue pelo catálogo com milhares de peças prontas para impressão e copie o link da página do modelo.
            </p>
            <a
              href="https://makerworld.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline pt-1"
            >
              <span>Ir para MakerWorld</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-black text-sm flex items-center justify-center">
              2
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Selecione Cores & Material</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              O BagreLab extrai os gramas de cada cor e você escolhe os filamentos disponíveis no estoque da oficina (PLA, PETG, ABS).
            </p>
            <div className="flex items-center gap-1.5 pt-1 text-[11px] text-slate-500 font-medium">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Estoque atualizado em tempo real</span>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-black text-sm flex items-center justify-center">
              3
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Receba a Proposta</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              O pedido chega instantaneamente no painel do Maker com todos os dados técnicos e o contato via WhatsApp para entrega.
            </p>
            <div className="flex items-center gap-1.5 pt-1 text-[11px] text-slate-500 font-medium">
              <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
              <span>Atendimento direto pelo WhatsApp</span>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="text-center text-xs text-slate-500 pt-6 border-t border-slate-200/80 space-y-2">
        <div className="flex items-center justify-center gap-2 font-bold text-slate-700">
          <img src="/bagrelab-logo.png" alt="BagreLab" className="w-5 h-5 rounded-md object-contain" />
          <span>BagreLab</span>
        </div>
        <p className="text-[11px]">
          Plataforma de orçamentos e precificação de impressão 3D baseada no MakerWorld.
        </p>
      </footer>

    </div>
  );
};
