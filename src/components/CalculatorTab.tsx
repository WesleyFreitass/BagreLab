import React, { useState } from 'react';
import {
  Printer,
  Material,
  WorkshopSettings,
  LaborActivity,
  ConsumableItem,
  QuoteItem,
  SavedQuote,
} from '../lib/types';
import {
  calculateQuote,
  formatCurrency,
  formatHours,
  defaultLaborActivities,
  defaultConsumables,
} from '../lib/calculator';
import { ProposalModal } from './ProposalModal';
import {
  Plus,
  Trash2,
  Copy,
  Check,
  FileText,
  Save,
  Clock,
  Percent,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface CalculatorTabProps {
  printers: Printer[];
  materials: Material[];
  settings: WorkshopSettings;
  onSaveQuote: (quote: Partial<SavedQuote>) => Promise<void>;
}

export const CalculatorTab: React.FC<CalculatorTabProps> = ({
  printers,
  materials,
  settings,
  onSaveQuote,
}) => {
  // Quote Header
  const [customerName, setCustomerName] = useState('Wesley Freitas');
  const [quoteNumber, setQuoteNumber] = useState(() => `ORC-${Date.now().toString().slice(-4)}`);
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Items / Mesas (Default Benchy)
  const [items, setItems] = useState<QuoteItem[]>([
    {
      id: 'item-1',
      name: '3DBenchy - Calibração',
      materialId: materials[0]?.id || 'pla-caro',
      printerId: printers[0]?.id || 'kobra-1',
      weightGrams: 47,
      printDays: 0,
      printHours: 4,
      printMinutes: 20,
    },
  ]);

  // Labor activities & Consumables
  const [laborActivities, setLaborActivities] = useState<LaborActivity[]>(defaultLaborActivities);
  const [consumables] = useState<ConsumableItem[]>(defaultConsumables);

  // Commercial indices
  const [profitMarginPercent, setProfitMarginPercent] = useState(settings.defaultProfitMarginPercent || 50);
  const [taxesPercent, setTaxesPercent] = useState(settings.taxesPercent || 0);
  const [cardFeePercent, setCardFeePercent] = useState(settings.cardFeePercent || 0);
  const [onlinePlatformFeePercent, setOnlinePlatformFeePercent] = useState(settings.onlinePlatformFeePercent || 0);
  const [shippingCost, setShippingCost] = useState(0);
  const [notes, setNotes] = useState('');

  // UI Collapsibles
  const [showLaborDetails, setShowLaborDetails] = useState(false);
  const [showCommercialRates, setShowCommercialRates] = useState(false);
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const [copiedZap, setCopiedZap] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Real-time calculation
  const calculation = calculateQuote(
    items,
    materials,
    printers,
    settings,
    laborActivities,
    consumables,
    profitMarginPercent,
    taxesPercent,
    cardFeePercent,
    onlinePlatformFeePercent,
    shippingCost
  );

  // Add new item
  const handleAddItem = () => {
    const newItem: QuoteItem = {
      id: `item-${Date.now()}`,
      name: `Peça #${items.length + 1}`,
      materialId: materials[0]?.id || '',
      printerId: printers[0]?.id || '',
      weightGrams: 50,
      printDays: 0,
      printHours: 2,
      printMinutes: 30,
    };
    setItems([...items, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) return;
    setItems(items.filter((item) => item.id !== id));
  };

  const handleUpdateItem = (id: string, updates: Partial<QuoteItem>) => {
    setItems(items.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  };

  // Labor minutes update
  const handleUpdateLabor = (id: string, minutes: number) => {
    setLaborActivities(
      laborActivities.map((act) => (act.id === id ? { ...act, minutes: Math.max(0, minutes) } : act))
    );
  };

  // Copy WhatsApp summary
  const handleCopyWhatsApp = () => {
    const text = `*Orçamento de Impressão 3D #${quoteNumber}*
Cliente: ${customerName || 'Cliente'}

Itens:
${items
  .map((i) => {
    const mat = materials.find((m) => m.id === i.materialId);
    return `• *${i.name || 'Peça'}*: ${i.weightGrams}g (${mat?.name || 'PLA'}) - Tempo: ${i.printHours}h ${i.printMinutes}m`;
  })
  .join('\n')}

💰 *Total à Vista (PIX):* ${formatCurrency(calculation.salePriceCash)}
${calculation.shippingCost > 0 ? `📦 *Frete:* ${formatCurrency(calculation.shippingCost)}\n*Total com Entrega:* ${formatCurrency(calculation.finalPriceWithShipping)}` : ''}

Prazo de produção: 1 a 2 dias úteis.`;

    navigator.clipboard.writeText(text);
    setCopiedZap(true);
    setTimeout(() => setCopiedZap(false), 2500);
  };

  // Save Quote handler
  const handleSave = async () => {
    try {
      setIsSaving(true);
      await onSaveQuote({
        quoteNumber,
        customerName,
        date,
        items,
        laborActivities,
        consumables,
        profitMarginPercent,
        taxesPercent,
        cardFeePercent,
        onlinePlatformFeePercent,
        shippingCost,
        notes,
        calculation,
        status: 'draft',
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Executive KPI Cards (Stripe Clean Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Production Cost */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center text-xs text-slate-500 font-medium mb-1">
              <span>Custo de Produção Total</span>
              <span className="font-mono text-slate-400">{formatHours(calculation.totalHours)}</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 font-mono tracking-tight">
              {formatCurrency(calculation.totalProductionCost)}
            </div>
          </div>
          <div className="text-[11px] text-slate-500 mt-2 flex justify-between border-t border-slate-100 pt-1.5">
            <span>Material: {formatCurrency(calculation.materialCost)}</span>
            <span>Máquina: {formatCurrency(calculation.machineCost)}</span>
          </div>
        </div>

        {/* KPI 2: Margin / Markup */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center text-xs text-slate-500 font-medium mb-1">
              <span>Margem de Lucro Bruta</span>
              <span className="font-mono text-blue-600 font-semibold">{calculation.markupMultiplier.toFixed(2)}x Mark-up</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-emerald-600 font-mono">
                {profitMarginPercent}%
              </span>
              <span className="text-xs text-slate-500 font-medium">líquido</span>
            </div>
          </div>
          <div className="mt-2 pt-1 border-t border-slate-100 flex items-center gap-2">
            <input
              type="range"
              min="10"
              max="80"
              step="5"
              value={profitMarginPercent}
              onChange={(e) => setProfitMarginPercent(Number(e.target.value))}
              className="w-full accent-blue-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* KPI 3: Final Sale Price */}
        <div className="bg-white rounded-xl border border-blue-200 p-5 shadow-xs flex flex-col justify-between bg-gradient-to-b from-blue-50/30 to-white">
          <div>
            <div className="flex justify-between items-center text-xs text-blue-700 font-medium mb-1">
              <span>Preço à Vista Recomendado</span>
              <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-semibold">Sem Frete</span>
            </div>
            <div className="text-2xl font-extrabold text-blue-600 font-mono tracking-tight">
              {formatCurrency(calculation.salePriceCash)}
            </div>
          </div>
          <div className="text-[11px] text-emerald-700 font-medium mt-2 border-t border-blue-100 pt-1.5 flex justify-between">
            <span>Seu Lucro Líquido:</span>
            <span className="font-mono font-bold">+{formatCurrency(calculation.profitCost)}</span>
          </div>
        </div>

        {/* KPI 4: Total With Shipping */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center text-xs text-slate-500 font-medium mb-1">
              <span>Total com Frete / Entrega</span>
              <span className="text-slate-400 font-mono">{shippingCost > 0 ? formatCurrency(shippingCost) : 'Frete Grátis'}</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 font-mono tracking-tight">
              {formatCurrency(calculation.finalPriceWithShipping)}
            </div>
          </div>
          <div className="text-[11px] text-slate-500 mt-2 border-t border-slate-100 pt-1.5 flex justify-between">
            <span>Cliente:</span>
            <span className="font-medium text-slate-800 truncate max-w-[120px]">{customerName || 'Cliente'}</span>
          </div>
        </div>

      </div>

      {/* Main Two-Column Structure */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Inputs & Items Management (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Header Card: Client & Quote Meta */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Identificação do Orçamento</h3>
              <span className="text-xs text-slate-500 font-mono">#{quoteNumber}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="text-slate-600 font-semibold block mb-1">Nome do Cliente / Empresa</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Wesley Freitas"
                />
              </div>

              <div>
                <label className="text-slate-600 font-semibold block mb-1">Código do Orçamento</label>
                <input
                  type="text"
                  value={quoteNumber}
                  onChange={(e) => setQuoteNumber(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-600 font-semibold block mb-1">Data da Cotação</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="text-xs pt-1">
              <label className="text-slate-600 font-semibold block mb-1">Observações / Detalhes Adicionais</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Cor preta, 20% infill, acabamento com primer automotivo..."
              />
            </div>
          </div>

          {/* Items / Mesas List */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Peças & Fatiamento da Mesa</h3>
                <p className="text-xs text-slate-500">Adicione uma ou múltiplas peças no mesmo orçamento</p>
              </div>
              <button
                onClick={handleAddItem}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-semibold cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Peça</span>
              </button>
            </div>

            <div className="space-y-4">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 space-y-3 relative group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px]">
                        {index + 1}
                      </span>
                      <span>Item #{index + 1}</span>
                    </span>

                    {items.length > 1 && (
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition-colors cursor-pointer"
                        title="Remover peça"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-slate-600 font-medium block mb-1">Nome / Descrição do Modelo</label>
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => handleUpdateItem(item.id, { name: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Ex: 3DBenchy"
                      />
                    </div>

                    <div>
                      <label className="text-slate-600 font-medium block mb-1">Filamento Selecionado</label>
                      <select
                        value={item.materialId}
                        onChange={(e) => handleUpdateItem(item.id, { materialId: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {materials.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({formatCurrency(m.costPerKg)}/kg)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-slate-600 font-medium block mb-1">Impressora 3D Alocada</label>
                      <select
                        value={item.printerId}
                        onChange={(e) => handleUpdateItem(item.id, { printerId: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {printers.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.powerKw * 1000}W • {formatCurrency(p.depreciationPerHour)}/h)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-slate-600 font-medium block mb-1">Massa Líquida da Peça</label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={item.weightGrams}
                          onChange={(e) => handleUpdateItem(item.id, { weightGrams: Number(e.target.value) })}
                          className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="absolute right-3 top-2 text-xs text-slate-400 font-medium">gramas</span>
                      </div>
                    </div>
                  </div>

                  {/* Print Time inputs */}
                  <div className="pt-2 border-t border-slate-200/60">
                    <label className="text-slate-600 font-medium text-xs block mb-1 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Tempo de Fatiamento (Duração da Máquina)</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          value={item.printDays}
                          onChange={(e) => handleUpdateItem(item.id, { printDays: Number(e.target.value) })}
                          className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-900 font-mono text-center font-semibold"
                        />
                        <span className="text-[10px] text-slate-400 block text-center mt-0.5">Dias</span>
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max="23"
                          value={item.printHours}
                          onChange={(e) => handleUpdateItem(item.id, { printHours: Number(e.target.value) })}
                          className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-900 font-mono text-center font-semibold"
                        />
                        <span className="text-[10px] text-slate-400 block text-center mt-0.5">Horas</span>
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max="59"
                          value={item.printMinutes}
                          onChange={(e) => handleUpdateItem(item.id, { printMinutes: Number(e.target.value) })}
                          className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-slate-900 font-mono text-center font-semibold"
                        />
                        <span className="text-[10px] text-slate-400 block text-center mt-0.5">Minutos</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Labor & Finishing Activities (Collapsible) */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <button
              onClick={() => setShowLaborDetails(!showLaborDetails)}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Mão de Obra Operacional & Preparação</h4>
                  <p className="text-[11px] text-slate-500">
                    Total: {calculation.laborMinutes} minutos ({formatCurrency(calculation.laborCost)}) • Taxa horária:{' '}
                    {formatCurrency(calculation.hourlyLaborRate)}/h
                  </p>
                </div>
              </div>
              {showLaborDetails ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {showLaborDetails && (
              <div className="p-4 pt-0 border-t border-slate-100 space-y-3 bg-slate-50/50">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-3">
                  {laborActivities.map((act) => (
                    <div key={act.id} className="flex items-center justify-between text-xs bg-white p-2.5 rounded-lg border border-slate-200">
                      <span className="text-slate-700 truncate pr-2">{act.name}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        <input
                          type="number"
                          min="0"
                          value={act.minutes}
                          onChange={(e) => handleUpdateLabor(act.id, Number(e.target.value))}
                          className="w-14 bg-slate-50 border border-slate-300 rounded px-2 py-1 text-slate-900 font-mono text-right font-semibold"
                        />
                        <span className="text-[11px] text-slate-400">min</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Commercial Rates & Freight (Collapsible) */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <button
              onClick={() => setShowCommercialRates(!showCommercialRates)}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Percent className="w-4 h-4 text-blue-600" />
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Impostos, Taxas de Venda & Frete</h4>
                  <p className="text-[11px] text-slate-500">
                    Impostos ({taxesPercent}%), Cartão ({cardFeePercent}%), Plataforma ({onlinePlatformFeePercent}%), Frete ({formatCurrency(shippingCost)})
                  </p>
                </div>
              </div>
              {showCommercialRates ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {showCommercialRates && (
              <div className="p-4 pt-0 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/50 pt-3 text-xs">
                <div>
                  <label className="text-slate-600 block mb-1 font-medium">Impostos (%)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={taxesPercent}
                    onChange={(e) => setTaxesPercent(Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono text-slate-900 font-semibold"
                  />
                </div>
                <div>
                  <label className="text-slate-600 block mb-1 font-medium">Taxa Cartão (%)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={cardFeePercent}
                    onChange={(e) => setCardFeePercent(Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono text-slate-900 font-semibold"
                  />
                </div>
                <div>
                  <label className="text-slate-600 block mb-1 font-medium">Marketplace (%)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={onlinePlatformFeePercent}
                    onChange={(e) => setOnlinePlatformFeePercent(Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono text-slate-900 font-semibold"
                  />
                </div>
                <div>
                  <label className="text-slate-600 block mb-1 font-medium">Frete / Envio (R$)</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={shippingCost}
                    onChange={(e) => setShippingCost(Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono text-slate-900 font-semibold"
                  />
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Right Column: DRE Analytic Breakdown & Actions (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* DRE Analytical Table (Stripe Style) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Demonstrativo DRE da Peça
                </h3>
                <span className="text-[11px] text-slate-500">Decomposição exata de custos e margem</span>
              </div>
              <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                100% da Venda
              </span>
            </div>

            {/* Proportional Progress Bar */}
            <div className="p-4 pb-0">
              <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden flex shadow-2xs">
                <div style={{ width: `${Math.max(2, calculation.breakdown.materialPercent)}%` }} className="bg-blue-600 h-full" title={`Material: ${calculation.breakdown.materialPercent.toFixed(1)}%`} />
                <div style={{ width: `${Math.max(2, calculation.breakdown.depreciationPercent)}%` }} className="bg-slate-500 h-full" title={`Depreciação: ${calculation.breakdown.depreciationPercent.toFixed(1)}%`} />
                <div style={{ width: `${Math.max(2, calculation.breakdown.electricityPercent)}%` }} className="bg-amber-400 h-full" title={`Energia: ${calculation.breakdown.electricityPercent.toFixed(1)}%`} />
                <div style={{ width: `${Math.max(2, calculation.breakdown.failurePercent)}%` }} className="bg-rose-400 h-full" title={`Falhas: ${calculation.breakdown.failurePercent.toFixed(1)}%`} />
                <div style={{ width: `${Math.max(2, calculation.breakdown.laborPercent)}%` }} className="bg-purple-500 h-full" title={`Mão de Obra: ${calculation.breakdown.laborPercent.toFixed(1)}%`} />
                <div style={{ width: `${Math.max(2, calculation.breakdown.profitPercent)}%` }} className="bg-emerald-500 h-full" title={`Lucro: ${calculation.breakdown.profitPercent.toFixed(1)}%`} />
              </div>
            </div>

            <div className="p-4 space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-600 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                  <span>1. Material (Filamento)</span>
                </span>
                <span className="font-mono font-semibold text-slate-900">
                  {formatCurrency(calculation.materialCost)} ({calculation.breakdown.materialPercent.toFixed(1)}%)
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-600 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-500"></span>
                  <span>2. Amortização de Máquina</span>
                </span>
                <span className="font-mono font-semibold text-slate-900">
                  {formatCurrency(calculation.depreciationCost)} ({calculation.breakdown.depreciationPercent.toFixed(1)}%)
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-600 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                  <span>3. Consumo Elétrico</span>
                </span>
                <span className="font-mono font-semibold text-slate-900">
                  {formatCurrency(calculation.electricityCost)} ({calculation.breakdown.electricityPercent.toFixed(1)}%)
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-600 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
                  <span>4. Fator Anti-Falha ({settings.failureRatePercent}%)</span>
                </span>
                <span className="font-mono font-semibold text-slate-900">
                  {formatCurrency(calculation.failureCost)} ({calculation.breakdown.failurePercent.toFixed(1)}%)
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-600 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                  <span>5. Mão de Obra do Serviço</span>
                </span>
                <span className="font-mono font-semibold text-slate-900">
                  {formatCurrency(calculation.laborCost)} ({calculation.breakdown.laborPercent.toFixed(1)}%)
                </span>
              </div>

              <div className="flex justify-between items-center py-2 bg-slate-50 px-2 rounded-lg font-bold text-slate-800">
                <span>Custo de Produção Total:</span>
                <span className="font-mono">{formatCurrency(calculation.totalProductionCost)}</span>
              </div>

              {(calculation.taxesCost > 0 || calculation.platformFeesCost > 0 || calculation.cardFeesCost > 0) && (
                <div className="flex justify-between items-center py-1 border-b border-slate-100 text-slate-500">
                  <span>Impostos & Taxas:</span>
                  <span className="font-mono">
                    {formatCurrency(calculation.taxesCost + calculation.platformFeesCost + calculation.cardFeesCost)}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center pt-2 text-emerald-700 font-bold text-sm">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span>Seu Lucro Líquido ({profitMarginPercent}%):</span>
                </span>
                <span className="font-mono">+{formatCurrency(calculation.profitCost)}</span>
              </div>
            </div>

            {/* Total Price Hero Box */}
            <div className="bg-slate-900 text-white p-5 text-center space-y-1">
              <span className="text-xs text-slate-400 uppercase font-bold tracking-wider block font-mono">
                Preço de Venda Sugerido
              </span>
              <div className="text-3xl font-black font-mono tracking-tight text-white">
                {formatCurrency(calculation.salePriceCash)}
              </div>
              <span className="text-[11px] text-slate-400 block">
                {shippingCost > 0 ? `Com frete: ${formatCurrency(calculation.finalPriceWithShipping)}` : 'À vista via PIX ou transferência'}
              </span>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-2.5">
            <button
              onClick={handleCopyWhatsApp}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 px-4 rounded-lg text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-colors"
            >
              {copiedZap ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedZap ? 'Copiado para o WhatsApp!' : 'Copiar Texto para o WhatsApp'}</span>
            </button>

            <button
              onClick={() => setIsProposalModalOpen(true)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-colors"
            >
              <FileText className="w-4 h-4" />
              <span>Visualizar Proposta Comercial (PDF / A4)</span>
            </button>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 px-4 rounded-lg text-xs flex items-center justify-center gap-2 border border-slate-300 cursor-pointer transition-colors"
            >
              {saveSuccess ? <Check className="w-4 h-4 text-emerald-600" /> : <Save className="w-4 h-4 text-slate-500" />}
              <span>{saveSuccess ? 'Orçamento Salvo com Sucesso!' : isSaving ? 'Salvando...' : 'Salvar no Histórico'}</span>
            </button>
          </div>

        </div>

      </div>

      {/* Printable Proposal Modal */}
      <ProposalModal
        isOpen={isProposalModalOpen}
        onClose={() => setIsProposalModalOpen(false)}
        customerName={customerName}
        quoteNumber={quoteNumber}
        date={date}
        items={items}
        materials={materials}
        printers={printers}
        calculation={calculation}
        notes={notes}
      />

    </div>
  );
};
