import React, { useState } from 'react';
import { AuthUser, Printer, Material, WorkshopSettings, SavedQuote } from '../lib/types';

interface LandingPageProps {
  printers: Printer[];
  materials: Material[];
  settings: WorkshopSettings;
  currentUser: AuthUser;
  onOpenLogin: () => void;
  onSubmitClientQuote?: (
    quoteData: Partial<SavedQuote>,
    decision: 'confirm_quote' | 'direct_print'
  ) => Promise<SavedQuote>;
  onNavigateToMakerWorld?: (url?: string) => void;
  onNavigateToMyRequests?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigateToMakerWorld,
}) => {
  const [simulationUrl, setSimulationUrl] = useState('');

  const handleSimulate = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!simulationUrl.trim()) return;
    if (onNavigateToMakerWorld) {
      onNavigateToMakerWorld(simulationUrl.trim());
    }
  };

  return (
    <section className="space-y-6">
      
      {/* BANNER PRINCIPAL COM CARIMBO E SIMULADOR */}
      <div className="paper-card p-6 sm:p-10 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div className="max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 stamp-badge text-xs font-bold rounded">
              <span>OFICINA DE MANUFATURA 3D // CÁLCULO DIRETO</span>
            </div>
            
            <h1 className="font-heading text-3xl sm:text-5xl font-bold tracking-tight text-[#221E1B] leading-tight">
              Orçamento exato da sua peça 3D direto na bancada.
            </h1>
            
            <p className="text-[#5C5349] text-base sm:text-lg leading-relaxed">
              Cole o link de qualquer modelo do <strong>MakerWorld</strong>. O BagreLab lê os dados reais de fatiamento, calcula os gramas por cor no nosso estoque de filamentos e gera o valor na hora.
            </p>
          </div>

          {/* Carimbo Circular Decorativo */}
          <div className="hidden lg:flex flex-col items-center justify-center w-36 h-36 rounded-full border-2 border-dashed border-[#6E6356] p-3 text-center rotate-6 bg-[#EFECE4] shrink-0">
            <span className="font-mono-tech text-[10px] tracking-widest uppercase text-[#5C5349]">FILAMENTOS</span>
            <span className="font-heading text-xl font-bold text-[#1E3E24] my-0.5">PLA • PETG • ABS</span>
            <span className="font-mono-tech text-[10px] text-[#5C5349]">ESTOQUE REAL</span>
          </div>
        </div>

        {/* Barra de Simulação Direta na Home */}
        <div className="mt-8 pt-6 border-t-2 border-dashed border-[#BDB2A2]">
          <label className="block font-mono-tech text-xs font-bold uppercase tracking-wider text-[#4A4239] mb-2">
            COLE O LINK DO MODELO NO MAKERWORLD PARA SIMULAR AGORA:
          </label>
          <form onSubmit={handleSimulate} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={simulationUrl}
              onChange={(e) => setSimulationUrl(e.target.value)}
              className="flex-1 bg-[#EFECE4] border-2 border-[#5A4E40] rounded px-4 py-3 font-mono-tech text-sm text-[#221E1B] focus:outline-none focus:border-[#1E3E24]"
              placeholder="Cole o link da peça no MakerWorld (ex: https://makerworld.com/pt/models/...)"
            />
            <button
              type="submit"
              disabled={!simulationUrl.trim()}
              className="btn-forest px-6 py-3 font-heading font-bold text-base flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>Orçar Peça</span>
              <span>→</span>
            </button>
          </form>
        </div>
      </div>

      {/* 3 Passos em Ficha de Oficina */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="paper-card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono-tech text-xs font-bold px-2 py-0.5 bg-[#D6C3A9] border border-[#5A4E40] rounded text-[#221E1B]">
              PASSO 01
            </span>
            <span className="font-mono-tech text-xs text-[#5C5349]">CATÁLOGO 3D</span>
          </div>
          <h3 className="font-heading text-lg font-bold mb-1 text-[#221E1B]">
            Escolha no MakerWorld
          </h3>
          <p className="text-sm text-[#5C5349] mb-3">
            Navegue por milhares de modelos prontos para impressão e copie o endereço da peça.
          </p>
          <a
            href="https://makerworld.com/pt"
            target="_blank"
            rel="noreferrer"
            className="font-mono-tech text-xs font-bold text-[#1E3E24] underline"
          >
            Abrir MakerWorld ↗
          </a>
        </div>

        <div className="paper-card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono-tech text-xs font-bold px-2 py-0.5 bg-[#D6C3A9] border border-[#5A4E40] rounded text-[#221E1B]">
              PASSO 02
            </span>
            <span className="font-mono-tech text-xs text-[#1E3E24] font-semibold">● 12 CORES ATIVAS</span>
          </div>
          <h3 className="font-heading text-lg font-bold mb-1 text-[#221E1B]">
            Selecione Cores & Material
          </h3>
          <p className="text-sm text-[#5C5349]">
            Extraímos o tempo e peso exatos e você escolhe os rolos de PLA, PETG ou ABS disponíveis na oficina.
          </p>
        </div>

        <div className="paper-card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono-tech text-xs font-bold px-2 py-0.5 bg-[#D6C3A9] border border-[#5A4E40] rounded text-[#221E1B]">
              PASSO 03
            </span>
            <span className="font-mono-tech text-xs text-[#5C5349]">WHATSAPP DIRETO</span>
          </div>
          <h3 className="font-heading text-lg font-bold mb-1 text-[#221E1B]">
            Produção e Entrega
          </h3>
          <p className="text-sm text-[#5C5349]">
            Aprove a produção imediata ou peça revisão técnica. O pedido entra direto na fila da impressora.
          </p>
        </div>
      </div>

    </section>
  );
};
