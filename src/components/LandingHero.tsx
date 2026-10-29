import React from 'react';
import { Sparkles, ArrowRight, ShieldCheck, Zap, Layers } from 'lucide-react';

interface LandingHeroProps {
  onOpenLogin: () => void;
  onStartQuote: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({
  onOpenLogin,
  onStartQuote,
}) => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-50 border border-slate-200/80 rounded-2xl shadow-sm mb-8 p-6 sm:p-10 text-center">
      {/* Decorative background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -z-0" />

      <div className="relative z-10 max-w-2xl mx-auto space-y-5">
        
        {/* Large Logo */}
        <div className="inline-block relative">
          <div className="absolute inset-0 bg-blue-400/20 rounded-2xl blur-xl" />
          <img
            src="/bagrelab-logo.png"
            alt="BagreLab Logo"
            className="w-24 h-24 sm:w-28 sm:h-28 object-contain mx-auto relative rounded-2xl shadow-md"
          />
        </div>

        {/* Title & Badge */}
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Precificação Inteligente de Impressão 3D</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            BagreLab
          </h1>

          {/* User Request: Uma frase explicando o que é o projeto */}
          <p className="text-base sm:text-lg text-slate-600 font-medium mt-3 leading-relaxed">
            Calcule o orçamento exato da sua impressão 3D em segundos a partir de qualquer modelo do MakerWorld.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={onOpenLogin}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer transform hover:-translate-y-0.5"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
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
            onClick={onStartQuote}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-semibold text-sm border border-slate-300 shadow-2xs transition-all cursor-pointer"
          >
            <span>Fazer Orçamento sem Login</span>
            <ArrowRight className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* Feature Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 border-t border-slate-200/60 text-xs text-slate-600 text-left">
          <div className="flex items-start gap-2.5 p-2 rounded-lg bg-white/60 border border-slate-200/50">
            <Zap className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-slate-800">1. Cole o Link</strong>
              <span>Importação direta de pesos e tempos do MakerWorld.</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-2 rounded-lg bg-white/60 border border-slate-200/50">
            <Layers className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-slate-800">2. Escolha as Cores</strong>
              <span>Estoque real de filamentos Volt (PLA, PETG, ABS).</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-2 rounded-lg bg-white/60 border border-slate-200/50">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-slate-800">3. Envie o Pedido</strong>
              <span>Preço transparente e envio direto para o WhatsApp do Maker.</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
