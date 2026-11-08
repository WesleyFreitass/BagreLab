import React, { useState } from 'react';
import { SavedQuote, Material, Printer, WorkshopSettings } from '../lib/types';
import { formatCurrency, formatWhatsAppRevisedQuoteMessage } from '../lib/calculator';
import { PIPELINE_STAGES, PipelineStageKey, getQuoteStage } from '../lib/pipeline';
import { ProposalModal } from './ProposalModal';
import { QuoteRevisionModal } from './QuoteRevisionModal';
import {
  Inbox,
  Clock,
  MessageSquare,
  Search,
  ExternalLink,
  Eye,
  Trash2,
  Phone,
  Wrench,
  Share2,
  CheckCircle2,
  Play,
  CreditCard,
  RotateCcw,
  DollarSign,
  Package,
  Layers,
  Lock,
  Pause,
  Printer as PrinterIcon,
  Check,
  Send,
} from 'lucide-react';

interface ClientRequestsTabProps {
  quotes: SavedQuote[];
  materials: Material[];
  printers: Printer[];
  settings: WorkshopSettings;
  onUpdateStatus: (id: string, status: SavedQuote['status']) => Promise<void>;
  onDeleteQuote: (id: string) => Promise<void>;
  onSaveQuote: (quote: Partial<SavedQuote>) => Promise<SavedQuote>;
  onOpenInCalculator?: (quote: SavedQuote) => void;
}

export const ClientRequestsTab: React.FC<ClientRequestsTabProps> = ({
  quotes,
  materials,
  printers,
  settings,
  onDeleteQuote,
  onSaveQuote,
  onOpenInCalculator,
}) => {
  const [stageFilter, setStageFilter] = useState<'all' | PipelineStageKey>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedQuote, setSelectedQuote] = useState<SavedQuote | null>(null);
  const [revisingQuote, setRevisingQuote] = useState<SavedQuote | null>(null);

  // Filter requests (quotes with clientDecision or makerWorldData or pending status)
  const clientQuotes = quotes.filter(
    (q) => q.clientDecision || q.makerWorldData || q.status === 'pending_review' || q.status === 'revised' || q.status === 'awaiting_payment' || q.status === 'queued'
  );

  // Stage counts for the pipeline navigation
  const stageCounts: Record<PipelineStageKey, number> = {
    pending_review: 0,
    awaiting_payment: 0,
    queued: 0,
    in_production: 0,
    completed: 0,
    cancelled: 0,
  };

  clientQuotes.forEach((q) => {
    const stage = getQuoteStage(q);
    if (stageCounts[stage] !== undefined) {
      stageCounts[stage]++;
    }
  });

  // Financial summary:
  const totalPendingPayment = clientQuotes
    .filter((q) => q.status !== 'cancelled' && q.paymentStatus !== 'paid')
    .reduce((sum, q) => sum + (q.calculation?.finalPriceWithShipping || q.calculation?.salePriceCash || 0), 0);

  const totalPaid = clientQuotes
    .filter((q) => q.paymentStatus === 'paid')
    .reduce((sum, q) => sum + (q.calculation?.finalPriceWithShipping || q.calculation?.salePriceCash || 0), 0);

  const countPendingPayment = clientQuotes.filter((q) => q.status !== 'cancelled' && q.paymentStatus !== 'paid').length;
  const countPaid = clientQuotes.filter((q) => q.paymentStatus === 'paid').length;
  const countInWorkshop = stageCounts.queued + stageCounts.in_production;

  // Filtered quotes based on active stage and search term
  const filtered = clientQuotes.filter((q) => {
    const matchesSearch =
      q.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (q.customerPhone && q.customerPhone.includes(searchTerm)) ||
      (q.makerWorldData?.modelTitle && q.makerWorldData.modelTitle.toLowerCase().includes(searchTerm.toLowerCase())) ||
      q.quoteNumber.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (stageFilter === 'all') return true;
    return getQuoteStage(q) === stageFilter;
  });

  // Stage Transitions
  const handleApproveForPayment = async (quote: SavedQuote) => {
    const updated: SavedQuote = {
      ...quote,
      status: 'awaiting_payment',
    };
    await onSaveQuote(updated);
  };

  const handleConfirmPayment = async (quote: SavedQuote) => {
    const updated: SavedQuote = {
      ...quote,
      status: 'queued',
      paymentStatus: 'paid',
      paidAt: new Date().toISOString(),
    };
    await onSaveQuote(updated);
  };

  const handleUndoPayment = async (quote: SavedQuote) => {
    const updated: SavedQuote = {
      ...quote,
      status: 'awaiting_payment',
      paymentStatus: 'pending',
      paidAt: undefined,
    };
    await onSaveQuote(updated);
  };

  const handleStartProduction = async (quote: SavedQuote) => {
    const updated: SavedQuote = {
      ...quote,
      status: 'in_production',
    };
    await onSaveQuote(updated);
  };

  const handlePauseProduction = async (quote: SavedQuote) => {
    const updated: SavedQuote = {
      ...quote,
      status: 'queued',
    };
    await onSaveQuote(updated);
  };

  const handleCompleteProduction = async (quote: SavedQuote) => {
    const updated: SavedQuote = {
      ...quote,
      status: 'completed',
    };
    await onSaveQuote(updated);
  };

  const handleReopenProduction = async (quote: SavedQuote) => {
    const updated: SavedQuote = {
      ...quote,
      status: 'queued',
    };
    await onSaveQuote(updated);
  };

  const handleReturnToAnalysis = async (quote: SavedQuote) => {
    const updated: SavedQuote = {
      ...quote,
      status: 'pending_review',
    };
    await onSaveQuote(updated);
  };

  // WhatsApp helpers
  const handleOpenWhatsApp = (q: SavedQuote) => {
    if (!q.customerPhone) return;
    let clean = q.customerPhone.replace(/\D/g, '');
    if (clean.length === 10 || clean.length === 11) clean = `55${clean}`;

    const text =
      q.clientDecision === 'direct_print'
        ? `Olá ${q.customerName}! Recebemos seu pedido com a opção PODE IMPRIMIR para o modelo "${
            q.makerWorldData?.modelTitle || 'Impressão 3D'
          }" (Orçamento #${q.quoteNumber}). Já estamos analisando os materiais para iniciar a produção!`
        : `Olá ${q.customerName}! Tudo bem? Recebemos sua solicitação de orçamento #${q.quoteNumber} para o modelo "${
            q.makerWorldData?.modelTitle || 'Impressão 3D'
          }". Estou entrando em contato para confirmar os detalhes técnicos!`;

    window.open(`https://api.whatsapp.com/send?phone=${clean}&text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleSendPaymentWhatsApp = (q: SavedQuote) => {
    if (!q.customerPhone) return;
    let clean = q.customerPhone.replace(/\D/g, '');
    if (clean.length === 10 || clean.length === 11) clean = `55${clean}`;

    const finalVal = q.calculation?.finalPriceWithShipping || q.calculation?.salePriceCash || 0;
    const text = `Olá ${q.customerName}! Seu orçamento #${q.quoteNumber} para o modelo "${
      q.makerWorldData?.modelTitle || 'Impressão 3D'
    }" está pronto e aprovado no valor de ${formatCurrency(
      finalVal
    )}.\n\nAssim que o pagamento Pix for confirmado, sua peça entra imediatamente na fila de impressão da bancada! 🚀`;

    window.open(`https://api.whatsapp.com/send?phone=${clean}&text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleSendCompletedWhatsApp = (q: SavedQuote) => {
    if (!q.customerPhone) return;
    let clean = q.customerPhone.replace(/\D/g, '');
    if (clean.length === 10 || clean.length === 11) clean = `55${clean}`;

    const text = `Olá ${q.customerName}! Sua impressão 3D do modelo "${
      q.makerWorldData?.modelTitle || 'Peça 3D'
    }" (Orçamento #${q.quoteNumber}) foi finalizada com sucesso! 🎉\n\nJá está pronta para retirada/envio. Podemos combinar a entrega?`;

    window.open(`https://api.whatsapp.com/send?phone=${clean}&text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleSendRevisedWhatsApp = (q: SavedQuote) => {
    if (!q.customerPhone) return;
    let clean = q.customerPhone.replace(/\D/g, '');
    if (clean.length === 10 || clean.length === 11) clean = `55${clean}`;

    const msg = formatWhatsAppRevisedQuoteMessage({
      quoteNumber: q.quoteNumber,
      customerName: q.customerName,
      modelTitle: q.makerWorldData?.modelTitle || q.items[0]?.name,
      originalPrice: q.originalPrice ?? q.calculation?.salePriceCash ?? 0,
      revisedPrice: q.calculation?.finalPriceWithShipping || q.calculation?.salePriceCash || 0,
      revisionNotes: q.revisionNotes,
      items: q.items,
      materials,
      shippingCost: q.shippingCost,
    });

    window.open(`https://api.whatsapp.com/send?phone=${clean}&text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Save revision handler
  const handleSaveRevision = async (updatedQuote: SavedQuote, openWhatsAppImmediately?: boolean) => {
    await onSaveQuote(updatedQuote);
    if (openWhatsAppImmediately) {
      handleSendRevisedWhatsApp(updatedQuote);
    }
  };

  // Step definitions for the progress indicator
  const pipelineSteps: { key: PipelineStageKey; label: string; number: number }[] = [
    { key: 'pending_review', label: '1. Análise', number: 1 },
    { key: 'awaiting_payment', label: '2. Pagamento', number: 2 },
    { key: 'queued', label: '3. Fila', number: 3 },
    { key: 'in_production', label: '4. Produção', number: 4 },
    { key: 'completed', label: '5. Concluído', number: 5 },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner & Financial Metrics */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-2 rounded-lg bg-blue-50 text-blue-600">
                <Inbox className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Gestão da Linha de Produção (Pipeline Maker)
              </h2>
            </div>
            <p className="text-sm text-slate-500">
              Fluxo operacional em 5 etapas: Análise Técnica ➔ Aguardando Pagamento ➔ Fila de Impressão ➔ Em Produção ➔ Concluído.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-slate-500" />
              <span>{clientQuotes.length} pedidos no total</span>
            </span>
          </div>
        </div>

        {/* Financial KPI Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-3 border-t border-slate-100">
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 font-mono block">
                Total Pendente de Pagamento
              </span>
              <div className="text-xl font-black font-mono text-amber-950 mt-0.5">
                {formatCurrency(totalPendingPayment)}
              </div>
              <span className="text-[11px] text-amber-700">
                {countPendingPayment} pedido(s) aguardando Pix
              </span>
            </div>
            <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 font-mono block">
                Total Pago e Confirmado
              </span>
              <div className="text-xl font-black font-mono text-emerald-950 mt-0.5">
                {formatCurrency(totalPaid)}
              </div>
              <span className="text-[11px] text-emerald-700">
                {countPaid} pedido(s) com baixa realizada
              </span>
            </div>
            <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between sm:col-span-2 lg:col-span-1">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono block">
                Ordens na Oficina
              </span>
              <div className="text-xl font-bold font-mono text-slate-800 mt-0.5">
                {countInWorkshop} em andamento
              </div>
              <span className="text-[11px] text-slate-500">
                {stageCounts.queued} na fila • {stageCounts.in_production} na máquina
              </span>
            </div>
            <div className="w-9 h-9 rounded-lg bg-slate-200/80 text-slate-700 flex items-center justify-center shrink-0">
              <PrinterIcon className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* 5-Stage Pipeline Stepper Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 w-full lg:w-auto">
          <button
            onClick={() => setStageFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              stageFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Todos ({clientQuotes.length})
          </button>

          <button
            onClick={() => setStageFilter('pending_review')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5 ${
              stageFilter === 'pending_review'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-blue-50 text-blue-900 hover:bg-blue-100 border border-blue-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>1. Análise Técnica ({stageCounts.pending_review})</span>
          </button>

          <button
            onClick={() => setStageFilter('awaiting_payment')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5 ${
              stageFilter === 'awaiting_payment'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>2. Aguardando Pagamento ({stageCounts.awaiting_payment})</span>
          </button>

          <button
            onClick={() => setStageFilter('queued')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5 ${
              stageFilter === 'queued'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>3. Fila de Impressão ({stageCounts.queued})</span>
          </button>

          <button
            onClick={() => setStageFilter('in_production')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5 ${
              stageFilter === 'in_production'
                ? 'bg-[#1E3E24] text-white shadow-xs'
                : 'bg-[#E3ECE4] text-[#1E3E24] hover:bg-[#d5e2d6] border border-[#b2ccb5]'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>4. Em Produção ({stageCounts.in_production})</span>
          </button>

          <button
            onClick={() => setStageFilter('completed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5 ${
              stageFilter === 'completed'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>5. Concluídos ({stageCounts.completed})</span>
          </button>

          {stageCounts.cancelled > 0 && (
            <button
              onClick={() => setStageFilter('cancelled')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1 ${
                stageFilter === 'cancelled'
                  ? 'bg-rose-600 text-white'
                  : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
              }`}
            >
              <span>Cancelados ({stageCounts.cancelled})</span>
            </button>
          )}
        </div>

        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar cliente, WhatsApp ou peça..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Requests Cards List */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 shadow-xs">
            <Inbox className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="font-semibold text-sm text-slate-700">Nenhum pedido nesta etapa do pipeline</p>
            <p className="text-xs text-slate-400 mt-1">
              Selecione "Todos" ou outra etapa acima para visualizar as ordens de serviço.
            </p>
          </div>
        ) : (
          filtered.map((quote) => {
            const qId = quote.id || quote._id || '';
            const stage = getQuoteStage(quote);
            const stageConfig = PIPELINE_STAGES[stage] || PIPELINE_STAGES.pending_review;
            const mw = quote.makerWorldData;
            const isRevised = !!quote.isRevised;
            const isPaid = quote.paymentStatus === 'paid';
            const quantity = quote.quantity || 1;
            const originalVal = quote.originalPrice ?? quote.calculation?.salePriceCash ?? 0;
            const currentVal = quote.calculation?.finalPriceWithShipping || quote.calculation?.salePriceCash || 0;
            const priceDiff = currentVal - originalVal;

            return (
              <div
                key={qId}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs transition-all space-y-4 hover:border-slate-300"
              >
                {/* Header Row: Thumbnail + Info + Price */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-3 border-b border-slate-100">
                  {/* Left: Model thumbnail and title */}
                  <div className="flex items-start gap-3.5">
                    {mw?.coverUrl ? (
                      <img
                        src={mw.coverUrl}
                        alt={mw.modelTitle}
                        className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0 shadow-2xs"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center font-bold text-xs shrink-0">
                        3D
                      </div>
                    )}

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono font-bold text-slate-500">#{quote.quoteNumber}</span>
                        <span className="text-xs text-slate-400">• {quote.date}</span>

                        {/* Prominent Unified Stage Badge */}
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${stageConfig.badgeBg} ${stageConfig.badgeText} ${stageConfig.badgeBorder}`}
                        >
                          <span>{stageConfig.label}</span>
                        </span>

                        {/* Quantity Badge */}
                        {quantity > 1 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-300 font-mono">
                            <Layers className="w-3 h-3 text-slate-500" />
                            <span>{quantity} un.</span>
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 leading-snug">
                        {mw?.modelTitle || quote.items[0]?.name || 'Peça 3D'}
                      </h3>

                      {mw?.sourceUrl && (
                        <a
                          href={mw.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline"
                        >
                          <span>Ver no MakerWorld</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Right: Value, Payment Status */}
                  <div className="text-left sm:text-right space-y-1.5 shrink-0">
                    {/* Status Financeiro */}
                    <div className="flex sm:justify-end">
                      {isPaid ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>PAGO</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span>A PAGAR</span>
                        </span>
                      )}
                    </div>

                    <div>
                      {isRevised && Math.abs(priceDiff) >= 0.05 ? (
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider font-mono">
                            Estimado: <span className="line-through">{formatCurrency(originalVal)}</span>
                          </span>
                          <div className="text-2xl font-black font-mono text-emerald-600 flex items-center gap-1.5 sm:justify-end">
                            <span>{formatCurrency(currentVal)}</span>
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded uppercase">
                              Real
                            </span>
                          </div>
                          <span
                            className={`text-[10px] font-bold ${
                              priceDiff > 0 ? 'text-amber-700' : 'text-emerald-700'
                            }`}
                          >
                            {priceDiff > 0 ? `+${formatCurrency(priceDiff)}` : `-${formatCurrency(Math.abs(priceDiff))}`}
                          </span>
                        </div>
                      ) : (
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider font-mono">
                            {isRevised ? 'Valor Real' : 'Valor Estimado'}
                          </span>
                          <div className="text-2xl font-black font-mono text-slate-900">
                            {formatCurrency(currentVal)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Visual 5-Step Pipeline Mini Stepper */}
                <div className="bg-slate-50/70 rounded-xl p-2.5 border border-slate-200/70">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    {pipelineSteps.map((step, idx) => {
                      const isCurrent = step.key === stage;
                      const isPast = stageConfig.stepNumber > step.number;

                      return (
                        <React.Fragment key={step.key}>
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                                isCurrent
                                  ? 'bg-blue-600 text-white ring-2 ring-blue-300'
                                  : isPast
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-slate-200 text-slate-600'
                              }`}
                            >
                              {isPast ? <Check className="w-3 h-3" /> : step.number}
                            </span>
                            <span
                              className={`hidden md:inline ${
                                isCurrent ? 'font-bold text-blue-900' : isPast ? 'font-semibold text-slate-700' : 'text-slate-400'
                              }`}
                            >
                              {step.label}
                            </span>
                          </div>
                          {idx < pipelineSteps.length - 1 && (
                            <div
                              className={`h-0.5 flex-1 mx-2 ${
                                stageConfig.stepNumber > step.number ? 'bg-emerald-400' : 'bg-slate-200'
                              }`}
                            />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>

                {/* Revision Notes Callout if Quote was Revised */}
                {isRevised && quote.revisionNotes && (
                  <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-3 text-xs text-blue-950 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-[11px] text-blue-900 uppercase tracking-wider font-mono">
                      <Wrench className="w-3.5 h-3.5 text-blue-600" />
                      <span>Justificativa da Revisão Técnica do Maker:</span>
                    </div>
                    <p className="text-slate-700 italic leading-relaxed">
                      "{quote.revisionNotes}"
                    </p>
                    {quote.revisedAt && (
                      <span className="text-[10px] text-slate-400 block pt-0.5 font-mono">
                        Revisado em: {new Date(quote.revisedAt).toLocaleString('pt-BR')}
                      </span>
                    )}
                  </div>
                )}

                {/* Details Row: Client Info & Filament Colors */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80">
                  {/* Client Info */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider font-mono">
                      Dados do Cliente:
                    </span>
                    <div className="flex items-center justify-between">
                      <strong className="text-slate-900 text-sm block">{quote.customerName}</strong>
                      <span className="text-[11px] text-slate-500 font-mono">Qtd: {quantity} un.</span>
                    </div>
                    {quote.customerPhone && (
                      <div className="flex items-center gap-2 font-mono text-slate-700 flex-wrap">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{quote.customerPhone}</span>
                        <button
                          onClick={() => handleOpenWhatsApp(quote)}
                          className="px-2 py-0.5 rounded bg-slate-200 hover:bg-slate-300 text-slate-800 font-sans text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1"
                          title="Abrir WhatsApp com o cliente"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>Conversar</span>
                        </button>
                      </div>
                    )}
                    {quote.customerEmail && (
                      <span className="text-slate-500 block text-[11px]">E-mail: {quote.customerEmail}</span>
                    )}
                  </div>

                  {/* Filaments Chosen by Client */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider font-mono">
                      Cores & Filamentos Selecionados:
                    </span>
                    {mw?.filaments && mw.filaments.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {mw.filaments.map((f, idx) => {
                          const mat = materials.find((m) => m.id === f.selectedMaterialId);
                          const colorHex = f.customColorHex || f.originalColor || '#3b82f6';
                          const isDark = colorHex === '#000000' || colorHex === '#001489';

                          return (
                            <div
                              key={idx}
                              style={{ backgroundColor: colorHex }}
                              className={`px-2.5 py-1 rounded-md text-[11px] font-bold shadow-2xs flex items-center gap-1 ${
                                isDark ? 'text-white' : 'text-slate-900'
                              }`}
                            >
                              <span>{mat?.name || f.originalType}</span>
                              <span className="opacity-60">|</span>
                              <span className="font-mono">{(f.usedG || 0) * quantity}g</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <span className="text-slate-500 italic text-xs">Especificação padrão da peça</span>
                    )}
                  </div>
                </div>

                {/* Maker Linear Action Controls tailored to Current Stage */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                  <div className="flex flex-wrap items-center gap-2">
                    
                    {/* ETAPA 1: Novas Solicitações (Análise Técnica) */}
                    {stage === 'pending_review' && (
                      <>
                        <button
                          onClick={() => setRevisingQuote(quote)}
                          className="px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                          title="Ajustar peso e tempo reais pós-fatiamento"
                        >
                          <Wrench className="w-3.5 h-3.5" />
                          <span>Revisar no Fatiador</span>
                        </button>

                        <button
                          onClick={() => handleApproveForPayment(quote)}
                          className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                          title="Confirmar valor estimado e liberar para pagamento"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Aprovar para Pagamento</span>
                        </button>

                        <button
                          onClick={() => handleOpenWhatsApp(quote)}
                          className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                          <span>Chamar no WhatsApp</span>
                        </button>
                      </>
                    )}

                    {/* ETAPA 2: Aguardando Pagamento (Pix) */}
                    {stage === 'awaiting_payment' && (
                      <>
                        <button
                          onClick={() => handleConfirmPayment(quote)}
                          className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                          title="Confirmar recebimento do Pix e liberar para fila de impressão"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Confirmar Pagamento (Pix Recebido)</span>
                        </button>

                        {isRevised ? (
                          <button
                            onClick={() => handleSendRevisedWhatsApp(quote)}
                            className="px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 transition-colors cursor-pointer flex items-center gap-1.5"
                            title="Enviar orçamento revisado no WhatsApp"
                          >
                            <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Enviar Proposta WhatsApp</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleSendPaymentWhatsApp(quote)}
                            className="px-3 py-2 rounded-xl text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 transition-colors cursor-pointer flex items-center gap-1.5"
                            title="Cobrar cliente com valor aprovado no WhatsApp"
                          >
                            <Send className="w-3.5 h-3.5 text-amber-700" />
                            <span>Cobrar no WhatsApp</span>
                          </button>
                        )}

                        <button
                          onClick={() => setRevisingQuote(quote)}
                          className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <Wrench className="w-3.5 h-3.5 text-slate-500" />
                          <span>Reajustar Orçamento</span>
                        </button>

                        <button
                          onClick={() => handleReturnToAnalysis(quote)}
                          className="px-2.5 py-2 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Voltar para análise técnica"
                        >
                          <RotateCcw className="w-3 h-3 inline mr-1" />
                          <span>Voltar</span>
                        </button>
                      </>
                    )}

                    {/* ETAPA 3: Fila de Impressão (Pago / Liberado) */}
                    {stage === 'queued' && (
                      <>
                        <button
                          onClick={() => handleStartProduction(quote)}
                          className="px-4 py-2 rounded-xl text-xs font-bold bg-[#1E3E24] hover:bg-[#152D19] text-white shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                          title="Colocar para rodar na impressora 3D"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>▶ Iniciar Impressão</span>
                        </button>

                        <button
                          onClick={() => handleUndoPayment(quote)}
                          className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors cursor-pointer flex items-center gap-1.5"
                          title="Desfazer baixa do pagamento"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                          <span>Desfazer Baixa</span>
                        </button>
                      </>
                    )}

                    {/* ETAPA 4: Em Produção (Na Máquina) */}
                    {stage === 'in_production' && (
                      <>
                        <button
                          onClick={() => handleCompleteProduction(quote)}
                          className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                          title="Concluir impressão e liberar peça"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>✅ Concluir Impressão</span>
                        </button>

                        <button
                          onClick={() => handlePauseProduction(quote)}
                          className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors cursor-pointer flex items-center gap-1"
                          title="Pausar e retornar à fila da bancada"
                        >
                          <Pause className="w-3 h-3 text-slate-600" />
                          <span>Pausar (Voltar Fila)</span>
                        </button>
                      </>
                    )}

                    {/* ETAPA 5: Concluídos */}
                    {stage === 'completed' && (
                      <>
                        <button
                          onClick={() => handleSendCompletedWhatsApp(quote)}
                          className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                          title="Avisar cliente que a peça está pronta para retirada"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span>🎉 Avisar no WhatsApp (Pronto)</span>
                        </button>

                        <button
                          onClick={() => handleReopenProduction(quote)}
                          className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors cursor-pointer flex items-center gap-1"
                          title="Reabrir ordem para reimpressão se necessário"
                        >
                          <RotateCcw className="w-3 h-3 text-slate-500" />
                          <span>Reabrir Pedido</span>
                        </button>
                      </>
                    )}
                  </div>

                  {/* Secondary Tools: A4 View & Delete */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedQuote(quote)}
                      className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      <span>Ver Proposta A4</span>
                    </button>

                    {stage === 'in_production' || stage === 'completed' ? (
                      <span
                        className="p-2 rounded-xl text-slate-300 flex items-center justify-center cursor-not-allowed"
                        title={
                          stage === 'in_production'
                            ? 'Impressão já iniciada na oficina (pause para a fila se desejar excluir)'
                            : 'Item concluído na oficina'
                        }
                      >
                        <Lock className="w-4 h-4 text-slate-300" />
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          if (confirm(`Deseja excluir a solicitação #${quote.quoteNumber}?`)) {
                            onDeleteQuote(qId);
                          }
                        }}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Excluir Solicitação"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Quote Revision Modal */}
      {revisingQuote && (
        <QuoteRevisionModal
          isOpen={Boolean(revisingQuote)}
          onClose={() => setRevisingQuote(null)}
          quote={revisingQuote}
          materials={materials}
          printers={printers}
          settings={settings}
          onSaveRevision={handleSaveRevision}
          onOpenInFullCalculator={onOpenInCalculator}
        />
      )}

      {/* Proposal Modal Preview */}
      {selectedQuote && (
        <ProposalModal
          isOpen={Boolean(selectedQuote)}
          onClose={() => setSelectedQuote(null)}
          quote={selectedQuote}
          customerName={selectedQuote.customerName}
          customerPhone={selectedQuote.customerPhone}
          customerEmail={selectedQuote.customerEmail}
          quoteNumber={selectedQuote.quoteNumber}
          date={selectedQuote.date}
          items={selectedQuote.items}
          materials={materials}
          printers={printers}
          calculation={selectedQuote.calculation}
          notes={selectedQuote.notes}
        />
      )}
    </div>
  );
};
