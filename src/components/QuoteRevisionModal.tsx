import React, { useState, useMemo } from 'react';
import {
  SavedQuote,
  Material,
  Printer,
  WorkshopSettings,
  QuoteItem,
  LaborActivity,
  ConsumableItem,
} from '../lib/types';
import {
  calculateQuote,
  formatCurrency,
  defaultLaborActivities,
} from '../lib/calculator';
import {
  X,
  Wrench,
  Share2,
  Save,
  Plus,
  Trash2,
  Calculator,
} from 'lucide-react';

interface QuoteRevisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  quote: SavedQuote | null;
  materials: Material[];
  printers: Printer[];
  settings: WorkshopSettings;
  onSaveRevision: (updatedQuote: SavedQuote, openWhatsAppImmediately?: boolean) => Promise<void>;
  onOpenInFullCalculator?: (quote: SavedQuote) => void;
}

export const QuoteRevisionModal: React.FC<QuoteRevisionModalProps> = ({
  isOpen,
  onClose,
  quote,
  materials,
  printers,
  settings,
  onSaveRevision,
  onOpenInFullCalculator,
}) => {
  if (!isOpen || !quote) return null;

  // Original baseline price that the client saw
  const baselineOriginalPrice = useMemo(() => {
    if (quote.originalPrice !== undefined && quote.originalPrice !== null) {
      return quote.originalPrice;
    }
    return quote.calculation?.finalPriceWithShipping || quote.calculation?.salePriceCash || 0;
  }, [quote]);

  // Initial items
  const initialItems: QuoteItem[] = useMemo(() => {
    if (quote.items && quote.items.length > 0) {
      return quote.items.map((i) => ({ ...i }));
    }
    // Fallback from MakerWorld filaments
    if (quote.makerWorldData?.filaments && quote.makerWorldData.filaments.length > 0) {
      return quote.makerWorldData.filaments.map((f, idx) => ({
        id: `rev-slot-${idx}`,
        name: `${quote.makerWorldData?.modelTitle || 'Peça'} (Slot ${idx + 1} - ${f.originalType})`,
        materialId: f.selectedMaterialId || materials[0]?.id || 'mat-1',
        printerId: printers[0]?.id || 'printer-1',
        weightGrams: f.usedG || 50,
        printDays: 0,
        printHours: 2,
        printMinutes: 30,
      }));
    }
    return [
      {
        id: `item-1`,
        name: quote.makerWorldData?.modelTitle || 'Peça Impressa 3D',
        materialId: materials[0]?.id || 'mat-1',
        printerId: printers[0]?.id || 'printer-1',
        weightGrams: 50,
        printDays: 0,
        printHours: 2,
        printMinutes: 0,
      },
    ];
  }, [quote, materials, printers]);

  const [items, setItems] = useState<QuoteItem[]>(initialItems);
  const [laborActivities] = useState<LaborActivity[]>(
    quote.laborActivities && quote.laborActivities.length > 0
      ? quote.laborActivities
      : defaultLaborActivities
  );
  const [consumables] = useState<ConsumableItem[]>(quote.consumables || []);
  const [profitMarginPercent, setProfitMarginPercent] = useState<number>(
    quote.profitMarginPercent ?? settings.defaultProfitMarginPercent ?? 50
  );
  const [shippingCost, setShippingCost] = useState<number>(quote.shippingCost || 0);
  const [revisionNotes, setRevisionNotes] = useState<string>(
    quote.revisionNotes || ''
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live Recalculation
  const currentCalculation = useMemo(() => {
    return calculateQuote(
      items,
      materials,
      printers,
      {
        ...settings,
        defaultProfitMarginPercent: profitMarginPercent,
      },
      laborActivities,
      consumables,
      profitMarginPercent,
      settings.taxesPercent || 0,
      settings.cardFeePercent || 0,
      settings.onlinePlatformFeePercent || 0,
      shippingCost
    );
  }, [items, materials, printers, settings, laborActivities, consumables, profitMarginPercent, shippingCost]);

  const currentFinalPrice = currentCalculation.finalPriceWithShipping || currentCalculation.salePriceCash || 0;
  const priceDiff = currentFinalPrice - baselineOriginalPrice;
  const pctDiff = baselineOriginalPrice > 0 ? (priceDiff / baselineOriginalPrice) * 100 : 0;

  // Item helpers
  const handleItemChange = (index: number, field: keyof QuoteItem, value: any) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleAddItem = () => {
    const newItem: QuoteItem = {
      id: `item-${Date.now()}`,
      name: `Nova Parte / Acessório`,
      materialId: materials[0]?.id || 'mat-1',
      printerId: printers[0]?.id || 'printer-1',
      weightGrams: 30,
      printDays: 0,
      printHours: 1,
      printMinutes: 0,
    };
    setItems((prev) => [...prev, newItem]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Quick revision notes templates
  const applyQuickNote = (noteText: string) => {
    setRevisionNotes((prev) => (prev ? `${prev}\n${noteText}` : noteText));
  };

  // Submit revision
  const handleSave = async (openWhatsApp: boolean) => {
    setIsSubmitting(true);
    try {
      const updatedQuote: SavedQuote = {
        ...quote,
        items,
        laborActivities,
        consumables,
        profitMarginPercent,
        shippingCost,
        calculation: currentCalculation,
        isRevised: true,
        originalPrice: baselineOriginalPrice,
        revisedPrice: currentFinalPrice,
        revisionNotes: revisionNotes.trim(),
        revisedAt: new Date().toISOString(),
        status: quote.status === 'completed' || quote.status === 'in_production' ? quote.status : 'revised',
      };

      await onSaveRevision(updatedQuote, openWhatsApp);
      onClose();
    } catch (err: any) {
      console.error(err);
      alert('Erro ao salvar revisão: ' + (err.message || 'Tente novamente.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-start justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white rounded-t-2xl">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[10px] font-bold uppercase tracking-wider font-mono flex items-center gap-1">
                <Wrench className="w-3 h-3 text-blue-400" />
                <span>Revisão Técnica do Maker</span>
              </span>
              <span className="text-xs text-slate-300 font-mono">#{quote.quoteNumber}</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white">
              Ajustar Orçamento Real (Pós-Fatiamento)
            </h2>
            <div className="text-xs text-slate-300 flex items-center gap-2 flex-wrap">
              <span>Cliente: <strong className="text-white">{quote.customerName}</strong></span>
              {quote.customerPhone && (
                <span>• Tel: <strong className="text-white font-mono">{quote.customerPhone}</strong></span>
              )}
              {quote.makerWorldData?.modelTitle && (
                <span>• Peça: <span className="text-blue-200 font-medium">{quote.makerWorldData.modelTitle}</span></span>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          
          {/* Top Price Comparison Banner */}
          <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
            {/* Valor Antigo */}
            <div className="space-y-1 text-center sm:text-left">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block font-mono">
                Valor Estimado Anterior
              </span>
              <div className="text-xl font-bold text-slate-400 line-through font-mono">
                {formatCurrency(baselineOriginalPrice)}
              </div>
              <span className="text-[11px] text-slate-400">
                Calculado inicialmente pelo cliente
              </span>
            </div>

            {/* Seta / Comparativo */}
            <div className="text-center flex flex-col items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold mb-1">
                ➔
              </div>
              {Math.abs(priceDiff) < 0.05 ? (
                <span className="text-[11px] font-bold text-slate-600 bg-slate-200 px-2 py-0.5 rounded-full">
                  Sem alteração
                </span>
              ) : priceDiff > 0 ? (
                <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
                  +{formatCurrency(priceDiff)} (+{pctDiff.toFixed(1)}%)
                </span>
              ) : (
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                  -{formatCurrency(Math.abs(priceDiff))} ({pctDiff.toFixed(1)}%)
                </span>
              )}
            </div>

            {/* Novo Valor Real */}
            <div className="space-y-1 text-center sm:text-right">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 block font-mono">
                ✨ Novo Valor Real Confirmado
              </span>
              <div className="text-2xl sm:text-3xl font-black text-emerald-600 font-mono">
                {formatCurrency(currentFinalPrice)}
              </div>
              <span className="text-[11px] text-emerald-700 font-medium">
                Reflete tempo real e peso exato do fatiador
              </span>
            </div>
          </div>

          {/* Section: Items & Real Printing Metrics */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 font-mono">
                <span>1. Ajustar Peças, Tempo Real e Peso (Slicer)</span>
              </h3>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Peça</span>
              </button>
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                      placeholder="Nome da peça"
                      className="font-bold text-xs sm:text-sm text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none flex-1 py-0.5"
                    />
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition-colors cursor-pointer"
                        title="Remover peça"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    {/* Material */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Filamento / Material
                      </label>
                      <select
                        value={item.materialId}
                        onChange={(e) => handleItemChange(idx, 'materialId', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg py-1.5 px-2 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      >
                        {materials.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({formatCurrency(m.costPerKg)}/kg)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Impressora */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Impressora 3D
                      </label>
                      <select
                        value={item.printerId}
                        onChange={(e) => handleItemChange(idx, 'printerId', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg py-1.5 px-2 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      >
                        {printers.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Peso real em gramas */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Peso Real (gramas)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="1"
                          step="0.5"
                          value={item.weightGrams || ''}
                          onChange={(e) => handleItemChange(idx, 'weightGrams', parseFloat(e.target.value) || 0)}
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg py-1.5 px-2 pr-7 text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">
                          g
                        </span>
                      </div>
                    </div>

                    {/* Tempo Real de Impressão */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Tempo Real (h e min)
                      </label>
                      <div className="flex items-center gap-1">
                        <div className="relative flex-1">
                          <input
                            type="number"
                            min="0"
                            placeholder="h"
                            value={item.printHours}
                            onChange={(e) => handleItemChange(idx, 'printHours', parseInt(e.target.value) || 0)}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg py-1.5 px-2 pr-5 text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          />
                          <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">
                            h
                          </span>
                        </div>
                        <div className="relative flex-1">
                          <input
                            type="number"
                            min="0"
                            max="59"
                            placeholder="m"
                            value={item.printMinutes}
                            onChange={(e) => handleItemChange(idx, 'printMinutes', parseInt(e.target.value) || 0)}
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg py-1.5 px-2 pr-5 text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          />
                          <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">
                            m
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Margin & Shipping */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                Margem de Lucro Desejada (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="500"
                  value={profitMarginPercent}
                  onChange={(e) => setProfitMarginPercent(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white border border-slate-300 rounded-lg py-1.5 px-3 pr-7 text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 font-bold">
                  %
                </span>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                Custo de Frete / Envio / Embalagem Especial (R$)
              </label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 font-bold">
                  R$
                </span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={shippingCost || ''}
                  onChange={(e) => setShippingCost(parseFloat(e.target.value) || 0)}
                  placeholder="0,00"
                  className="w-full bg-white border border-slate-300 rounded-lg py-1.5 pl-8 pr-3 text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section: Revision Explanation Notes for Customer */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 font-mono">
                2. Justificativa / Observação do Maker para o Cliente
              </label>
              <span className="text-[11px] text-slate-400">
                Esta mensagem aparecerá na proposta e no WhatsApp
              </span>
            </div>

            <textarea
              rows={3}
              value={revisionNotes}
              onChange={(e) => setRevisionNotes(e.target.value)}
              placeholder="Ex: Ajustado tempo de impressão de 3h para 4h15min após fatiamento fino com suporte tipo árvore e altura de camada 0.16mm para máximo detalhe."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />

            {/* Quick Suggestions Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] text-slate-400 font-semibold uppercase">Sugestões rápidas:</span>
              <button
                type="button"
                onClick={() => applyQuickNote('Fatiamento com suportes tipo árvore e camada fina 0.16mm.')}
                className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-medium transition-colors cursor-pointer"
              >
                + Suportes tipo árvore (0.16mm)
              </button>
              <button
                type="button"
                onClick={() => applyQuickNote('Ajustado peso do filamento com torre de purga e preenchimento giroscópio 20%.')}
                className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-medium transition-colors cursor-pointer"
              >
                + Torre de purga / 20% gyro
              </button>
              <button
                type="button"
                onClick={() => applyQuickNote('Valor técnico validado exatamente conforme estimativa inicial.')}
                className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-medium transition-colors cursor-pointer"
              >
                + Valor validado sem alteração
              </button>
            </div>
          </div>

          {/* Quick link to Open in Full Calculator */}
          {onOpenInFullCalculator && (
            <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 flex items-center justify-between gap-3 text-xs text-blue-900">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Precisa de cálculos avançados de depreciação mensal ou custos fixos de oficina?</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onOpenInFullCalculator({
                    ...quote,
                    items,
                    profitMarginPercent,
                    shippingCost,
                    revisionNotes,
                    calculation: currentCalculation,
                  });
                  onClose();
                }}
                className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[11px] transition-colors cursor-pointer shrink-0"
              >
                Abrir na Calculadora Completa
              </button>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 font-semibold text-xs transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSave(false)}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Orçamento Real</span>
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSave(true)}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
            >
              <Share2 className="w-4 h-4" />
              <span>Salvar e Enviar no WhatsApp 📲</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
