import React, { useState } from 'react';
import {
  Printer,
  Material,
  WorkshopSettings,
  MakerWorldModelData,
  MakerWorldInstance,
  QuoteItem,
} from '../lib/types';
import { parseMakerWorldUrl, sendWhatsAppMessageApi } from '../lib/api';
import { calculateQuote, formatCurrency, formatHours } from '../lib/calculator';
import {
  Sparkles,
  Link as LinkIcon,
  Search,
  AlertCircle,
  ExternalLink,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  Sliders,
} from 'lucide-react';

interface MakerWorldTabProps {
  printers: Printer[];
  materials: Material[];
  settings: WorkshopSettings;
  onImportToCalculator: (data: {
    modelTitle: string;
    items: QuoteItem[];
    notes?: string;
  }) => void;
}

export const MakerWorldTab: React.FC<MakerWorldTabProps> = ({
  printers,
  materials,
  settings,
  onImportToCalculator,
}) => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modelData, setModelData] = useState<MakerWorldModelData | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<MakerWorldInstance | null>(null);

  // Workshop calibration overrides for this quote
  const [selectedPrinterId, setSelectedPrinterId] = useState<string>(printers[0]?.id || '');
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>(materials[0]?.id || '');
  const [profitMargin, setProfitMargin] = useState(settings.defaultProfitMarginPercent || 50);
  const [customerWhatsApp, setCustomerWhatsApp] = useState('');
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);
  const [whatsAppSuccess, setWhatsAppSuccess] = useState(false);

  const sampleUrl = 'https://makerworld.com/pt/models/13038-flying-fish#profileId-83672';

  const handleFetch = async (targetUrl = url) => {
    if (!targetUrl || !targetUrl.trim()) {
      setError('Por favor, informe a URL do modelo no MakerWorld.');
      return;
    }

    if (!targetUrl.toLowerCase().includes('makerworld.com')) {
      setError('Apenas links oficiais da plataforma MakerWorld são aceitos.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await parseMakerWorldUrl(targetUrl.trim());
      setModelData(data);
      setSelectedProfile(data.selectedInstance || data.instances[0] || null);

      // Tenta mapear automaticamente o material da oficina correspondente (ex: PETG ou PLA)
      const primaryFilament = data.selectedInstance?.filaments[0]?.type?.toUpperCase();
      if (primaryFilament) {
        const matchingMat = materials.find((m) => m.name.toUpperCase().includes(primaryFilament) || m.type.toUpperCase().includes(primaryFilament));
        if (matchingMat) {
          setSelectedMaterialId(matchingMat.id);
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao carregar dados do MakerWorld.');
    } finally {
      setIsLoading(false);
    }
  };

  // Profile switch handler
  const handleSelectProfile = (instanceId: number) => {
    if (!modelData) return;
    const found = modelData.instances.find((i) => i.id === instanceId);
    if (found) {
      setSelectedProfile(found);
    }
  };

  // Calculate live price based on current profile and settings
  const calculation = React.useMemo(() => {
    if (!selectedProfile) return null;

    // Converte o perfil do MakerWorld em item de cotação da nossa engenharia de custos
    const quoteItems: QuoteItem[] = [
      {
        id: `mw-${selectedProfile.id}`,
        name: `${modelData?.title || 'Modelo'} (${selectedProfile.title.slice(0, 35)}...)`,
        materialId: selectedMaterialId || materials[0]?.id || 'mat-1',
        printerId: selectedPrinterId || printers[0]?.id || 'kobra-1',
        weightGrams: selectedProfile.weightGrams || 10,
        printDays: selectedProfile.printDays,
        printHours: selectedProfile.printHours,
        printMinutes: selectedProfile.printMinutes,
      },
    ];

    const currentPrinter = printers.find((p) => p.id === selectedPrinterId) || printers[0];
    const currentMaterial = materials.find((m) => m.id === selectedMaterialId) || materials[0];

    return calculateQuote(
      quoteItems,
      currentMaterial ? [currentMaterial] : materials,
      currentPrinter ? [currentPrinter] : printers,
      {
        ...settings,
        defaultProfitMarginPercent: profitMargin,
      },
      [
        { id: 'act-1', name: 'Preparação & Fatiamento MakerWorld', minutes: 10 },
        { id: 'act-2', name: 'Troca de Mesa & Pós-processamento', minutes: 15 },
      ],
      [],
      profitMargin,
      settings.taxesPercent || 0,
      settings.cardFeePercent || 0,
      settings.onlinePlatformFeePercent || 0,
      0
    );
  }, [selectedProfile, selectedMaterialId, selectedPrinterId, profitMargin, modelData, printers, materials, settings]);

  // Handle direct import to main calculator
  const handleImport = () => {
    if (!selectedProfile || !modelData) return;

    const filamentsSummary = selectedProfile.filaments
      .map((f) => `${f.type}: ${f.usedG}g`)
      .join(' | ');

    onImportToCalculator({
      modelTitle: modelData.title,
      notes: `Importado do MakerWorld (#${modelData.designId})\nPerfil: ${selectedProfile.title}\nFilamentos: ${filamentsSummary}\nLink: ${modelData.sourceUrl}`,
      items: [
        {
          id: `mw-item-${Date.now()}`,
          name: `${modelData.title} - ${selectedProfile.title.slice(0, 30)}`,
          materialId: selectedMaterialId || materials[0]?.id || 'mat-1',
          printerId: selectedPrinterId || printers[0]?.id || 'kobra-1',
          weightGrams: selectedProfile.weightGrams,
          printDays: selectedProfile.printDays,
          printHours: selectedProfile.printHours,
          printMinutes: selectedProfile.printMinutes,
        },
      ],
    });
  };

  // Handle WhatsApp dispatch
  const handleSendWhatsApp = async () => {
    if (!customerWhatsApp || customerWhatsApp.replace(/\D/g, '').length < 8) {
      alert('Por favor, informe o WhatsApp do cliente para enviar o orçamento.');
      return;
    }
    if (!selectedProfile || !modelData || !calculation) return;

    setIsSendingWhatsApp(true);

    const message = `📐 *ORÇAMENTO ESTIMADO - IMPRESSÃO 3D*
Peça: *${modelData.title}*
Link do Modelo: ${modelData.sourceUrl}

📋 *Especificações do Perfil (${selectedProfile.title.slice(0, 40)}):*
⏱️ *Tempo de Impressão:* ~${formatHours(selectedProfile.totalHours)}
⚖️ *Peso Total:* ${selectedProfile.weightGrams}g
🍽️ *Pratos de Mesa:* ${selectedProfile.platesCount} prato(s)
🎨 *Filamentos Utilizados:* ${selectedProfile.filaments.map((f) => `${f.type} (${f.usedG}g)`).join(', ')}

💰 *Valor Estimado do Pedido:* ${formatCurrency(calculation.salePriceCash)}
✅ *Validade da Proposta:* 15 dias corridos

Para confirmar a produção na cor e material desejado, basta nos responder por aqui!`;

    try {
      const res = await sendWhatsAppMessageApi({
        phone: customerWhatsApp,
        message,
      });

      if (res.mode === 'link' && res.whatsappUrl) {
        window.open(res.whatsappUrl, '_blank');
      }
      setWhatsAppSuccess(true);
      setTimeout(() => setWhatsAppSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      alert('Erro ao disparar mensagem.');
    } finally {
      setIsSendingWhatsApp(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <Sparkles className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Orçamento Automático MakerWorld
            </h2>
          </div>
          <p className="text-sm text-slate-500">
            Cole a URL de qualquer peça do <strong>MakerWorld</strong> para extrair tempo, pratos e consumo de filamento instantaneamente.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Filtro Ativo: Aceita estritamente modelos do MakerWorld</span>
        </div>
      </div>

      {/* URL Input Box (Stripe Clean Style) */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
          Link do Modelo no MakerWorld:
        </label>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Ex: https://makerworld.com/pt/models/13038-flying-fish#profileId-83672"
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={() => handleFetch(url)}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-5 py-2.5 rounded-lg shadow-2xs transition-colors cursor-pointer shrink-0 disabled:opacity-50"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            <span>{isLoading ? 'Analisando Modelo...' : 'Extrair Métricas & Orçar'}</span>
          </button>
        </div>

        {/* Quick Test Pill */}
        <div className="flex items-center gap-2 text-xs text-slate-500 pt-1">
          <span>Sugestão de teste:</span>
          <button
            type="button"
            onClick={() => {
              setUrl(sampleUrl);
              handleFetch(sampleUrl);
            }}
            className="text-blue-600 hover:underline font-mono text-[11px] bg-blue-50 px-2 py-0.5 rounded cursor-pointer"
          >
            Peixe Voador (13038-flying-fish)
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Result Section when Model is Fetched */}
      {modelData && selectedProfile && calculation && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: MakerWorld Print Profile Card (Image 2 Replica) (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              {/* Header with Model Title and External Link */}
              <div className="p-5 border-b border-slate-100 flex items-start gap-4">
                {modelData.coverUrl && (
                  <img
                    src={modelData.coverUrl}
                    alt={modelData.title}
                    className="w-20 h-20 rounded-xl object-cover border border-slate-200 shadow-2xs shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      MakerWorld Verified
                    </span>
                    <span className="text-xs text-slate-400 font-mono">#{modelData.designId}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 truncate">
                    {modelData.title}
                  </h3>
                  <div className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                    <span>Designer: <strong>{modelData.creatorName}</strong></span>
                    <span>•</span>
                    <a
                      href={modelData.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:underline inline-flex items-center gap-1 font-medium"
                    >
                      <span>Ver no MakerWorld</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Profile Selector if multiple exist */}
              {modelData.instances.length > 1 && (
                <div className="bg-slate-50/70 px-5 py-3 border-b border-slate-200 flex items-center justify-between gap-3 text-xs">
                  <span className="text-slate-600 font-semibold shrink-0">
                    Perfil de Impressão:
                  </span>
                  <select
                    value={selectedProfile.id}
                    onChange={(e) => handleSelectProfile(Number(e.target.value))}
                    className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full max-w-sm truncate"
                  >
                    {modelData.instances.map((inst) => (
                      <option key={inst.id} value={inst.id}>
                        {inst.title} ({inst.weightGrams}g, ~{formatHours(inst.totalHours)})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Exact Card Breakdown (Replicating Image 2) */}
              <div className="p-5 space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    {selectedProfile.title}
                  </h4>
                  {selectedProfile.compatibilityPrinters.length > 0 && (
                    <div className="text-[11px] text-slate-500 mt-1 flex flex-wrap gap-1 items-center">
                      <span className="font-medium text-slate-600">Compatível:</span>
                      <span className="text-slate-500">{selectedProfile.compatibilityPrinters.slice(0, 6).join(', ')}</span>
                    </div>
                  )}
                </div>

                {/* Metrics Badges: Pratos, Horas, Bico, Peso */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Mesa / Pratos</span>
                    <strong className="text-sm text-slate-900 font-mono">
                      {selectedProfile.platesCount} Prato{selectedProfile.platesCount > 1 ? 's' : ''}
                    </strong>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Tempo Total</span>
                    <strong className="text-sm text-slate-900 font-mono">
                      {formatHours(selectedProfile.totalHours)}
                    </strong>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Bico Recomendado</span>
                    <strong className="text-sm text-slate-900 font-mono">
                      {selectedProfile.nozzleDiameter} mm
                    </strong>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Peso Total</span>
                    <strong className="text-sm text-slate-900 font-mono">
                      {selectedProfile.weightGrams} g
                    </strong>
                  </div>
                </div>

                {/* Filament Colors Pills (Exact match to Image 2) */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Consumo Detalhado por Filamento:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {selectedProfile.filaments.map((f, idx) => {
                      const isDark = f.color === '#000000' || f.color === '#001489';
                      return (
                        <div
                          key={idx}
                          style={{ backgroundColor: f.color }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold shadow-2xs flex items-center gap-1.5 ${
                            isDark ? 'text-white' : 'text-slate-900'
                          }`}
                        >
                          <span>{f.type}</span>
                          <span className="opacity-60">|</span>
                          <span className="font-mono">{f.usedG} g</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Calibration Bar (Choose Workshop Printer & Material) */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Sliders className="w-4 h-4 text-blue-600" />
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Configurações de Custo da Oficina para este Orçamento
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="text-slate-600 font-semibold block mb-1">Filamento Base (Preço/kg)</label>
                  <select
                    value={selectedMaterialId}
                    onChange={(e) => setSelectedMaterialId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {materials.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({formatCurrency(m.costPerKg)}/kg)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-600 font-semibold block mb-1">Impressora Alocada</label>
                  <select
                    value={selectedPrinterId}
                    onChange={(e) => setSelectedPrinterId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {printers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({formatCurrency(p.depreciationPerHour)}/h)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-600 font-semibold block mb-1">
                    Margem de Lucro: <strong className="text-blue-600">{profitMargin}%</strong>
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="80"
                    step="5"
                    value={profitMargin}
                    onChange={(e) => setProfitMargin(Number(e.target.value))}
                    className="w-full mt-2 accent-blue-600 cursor-pointer"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Calculated Quote & Instant Actions (5 Cols) */}
          <div className="lg:col-span-5 space-y-5">
            
            {/* Price Hero Box (Stripe Clean Style) */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="bg-slate-900 text-white p-6 text-center space-y-1">
                <span className="text-xs text-slate-400 uppercase font-bold tracking-wider block font-mono">
                  Orçamento Estimado (À Vista / PIX)
                </span>
                <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white py-1">
                  {formatCurrency(calculation.salePriceCash)}
                </div>
                <span className="text-[11px] text-slate-400 block">
                  Baseado em {selectedProfile.weightGrams}g de filamento e ~{formatHours(selectedProfile.totalHours)} de impressão
                </span>
              </div>

              {/* DRE Summary List */}
              <div className="p-5 space-y-2.5 text-xs text-slate-600 border-t border-slate-100">
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span>Custo de Filamento ({selectedProfile.weightGrams}g)</span>
                  <span className="font-mono font-medium text-slate-800">{formatCurrency(calculation.materialCost)}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span>Depreciação da Máquina (~{formatHours(selectedProfile.totalHours)})</span>
                  <span className="font-mono font-medium text-slate-800">{formatCurrency(calculation.depreciationCost)}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span>Energia Elétrica</span>
                  <span className="font-mono font-medium text-slate-800">{formatCurrency(calculation.electricityCost)}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span>Risco de Falha ({settings.failureRatePercent || 15}%)</span>
                  <span className="font-mono font-medium text-slate-800">{formatCurrency(calculation.failureCost)}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span>Mão de Obra Oficina</span>
                  <span className="font-mono font-medium text-slate-800">{formatCurrency(calculation.laborCost)}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 font-bold text-slate-900 bg-slate-50 px-2 rounded-lg">
                  <span>Custo Total de Produção</span>
                  <span className="font-mono">{formatCurrency(calculation.totalProductionCost)}</span>
                </div>
                <div className="flex justify-between items-center py-1 text-emerald-700 font-semibold px-2">
                  <span>Lucro Líquido Estimado ({profitMargin}%)</span>
                  <span className="font-mono">{formatCurrency(calculation.profitCost)}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Ações Rápidas com este Orçamento
              </h4>

              {/* Import to Main Calculator */}
              <button
                onClick={handleImport}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg text-xs flex items-center justify-center gap-2 shadow-2xs transition-colors cursor-pointer"
              >
                <span>Importar para a Calculadora Principal</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Direct WhatsApp Send */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <label className="text-[11px] font-semibold text-slate-600 block">
                  Enviar Orçamento Direto no WhatsApp:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customerWhatsApp}
                    onChange={(e) => setCustomerWhatsApp(e.target.value)}
                    placeholder="WhatsApp com DDD (11999998888)"
                    className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleSendWhatsApp}
                    disabled={isSendingWhatsApp}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 py-2 rounded-lg text-xs flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{whatsAppSuccess ? 'Enviado!' : 'Enviar'}</span>
                  </button>
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
};
