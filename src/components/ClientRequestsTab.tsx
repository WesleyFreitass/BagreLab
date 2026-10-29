import React, { useState } from 'react';
import { SavedQuote, Material, Printer, WorkshopSettings } from '../lib/types';
import { formatCurrency, formatWhatsAppRevisedQuoteMessage } from '../lib/calculator';
import { ProposalModal } from './ProposalModal';
import { QuoteRevisionModal } from './QuoteRevisionModal';
import {
  Inbox,
  Rocket,
  Clock,
  MessageSquare,
  Search,
  ExternalLink,
  Eye,
  Trash2,
  Phone,
  Wrench,
  Sparkles,
  Share2,
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
  onUpdateStatus,
  onDeleteQuote,
  onSaveQuote,
  onOpenInCalculator,
}) => {
  const [filter, setFilter] = useState<'all' | 'direct_print' | 'confirm_quote' | 'revised' | 'in_production' | 'completed'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedQuote, setSelectedQuote] = useState<SavedQuote | null>(null);
  const [revisingQuote, setRevisingQuote] = useState<SavedQuote | null>(null);

  // Filter requests (quotes with clientDecision or makerWorldData or pending status)
  const clientQuotes = quotes.filter((q) => q.clientDecision || q.makerWorldData || q.status === 'pending_review' || q.status === 'revised');

  const filtered = clientQuotes.filter((q) => {
    const matchesSearch =
      q.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (q.customerPhone && q.customerPhone.includes(searchTerm)) ||
      (q.makerWorldData?.modelTitle && q.makerWorldData.modelTitle.toLowerCase().includes(searchTerm.toLowerCase())) ||
      q.quoteNumber.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (filter === 'direct_print') return q.clientDecision === 'direct_print';
    if (filter === 'confirm_quote') return q.clientDecision === 'confirm_quote' && !q.isRevised;
    if (filter === 'revised') return q.isRevised;
    if (filter === 'in_production') return q.status === 'in_production';
    if (filter === 'completed') return q.status === 'completed';

    return true;
  });

  const countDirectPrint = clientQuotes.filter((q) => q.clientDecision === 'direct_print').length;
  const countConfirmQuote = clientQuotes.filter((q) => q.clientDecision === 'confirm_quote' && !q.isRevised).length;
  const countRevised = clientQuotes.filter((q) => q.isRevised).length;

  // Standard initial WhatsApp message
  const handleOpenWhatsApp = (q: SavedQuote) => {
    if (!q.customerPhone) return;
    let clean = q.customerPhone.replace(/\D/g, '');
    if (clean.length === 10 || clean.length === 11) clean = `55${clean}`;

    const text = q.clientDecision === 'direct_print'
      ? `Olá ${q.customerName}! Recebemos seu pedido com a opção *PODE IMPRIMIR* para o modelo "${q.makerWorldData?.modelTitle || 'Impressão 3D'}" (Orçamento #${q.quoteNumber}). Já estamos analisando os materiais para iniciar a produção!`
      : `Olá ${q.customerName}! Tudo bem? Recebemos sua solicitação de orçamento #${q.quoteNumber} para o modelo "${q.makerWorldData?.modelTitle || 'Impressão 3D'}". Estou entrando em contato para confirmar os detalhes técnicos!`;

    window.open(`https://api.whatsapp.com/send?phone=${clean}&text=${encodeURIComponent(text)}`, '_blank');
  };

  // WhatsApp message for REVISED quotes (Old vs New value)
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

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Inbox className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Orçamentos Solicitados por Clientes
            </h2>
          </div>
          <p className="text-sm text-slate-500">
            Revise os orçamentos estimados pelos clientes, faça o fatiamento real, ajuste valores e envie a proposta final pelo WhatsApp.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {countRevised > 0 && (
            <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>{countRevised} revisado(s) pelo Maker</span>
            </span>
          )}
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
            <Rocket className="w-3.5 h-3.5" />
            <span>{countDirectPrint} pedidos "Pode Imprimir"</span>
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              filter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos ({clientQuotes.length})
          </button>

          <button
            onClick={() => setFilter('confirm_quote')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              filter === 'confirm_quote'
                ? 'bg-blue-600 text-white'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
            }`}
          >
            Aguardando Revisão ({countConfirmQuote})
          </button>

          <button
            onClick={() => setFilter('revised')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1 ${
              filter === 'revised'
                ? 'bg-indigo-600 text-white'
                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Revisados ({countRevised})</span>
          </button>

          <button
            onClick={() => setFilter('direct_print')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1 ${
              filter === 'direct_print'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            <Rocket className="w-3.5 h-3.5" />
            <span>Pode Imprimir ({countDirectPrint})</span>
          </button>

          <button
            onClick={() => setFilter('in_production')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              filter === 'in_production'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            Em Produção
          </button>

          <button
            onClick={() => setFilter('completed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              filter === 'completed'
                ? 'bg-purple-600 text-white'
                : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
            }`}
          >
            Concluídos
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por cliente, WhatsApp ou peça..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Requests Cards List */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 shadow-xs">
            <Inbox className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="font-semibold text-sm text-slate-700">Nenhuma solicitação encontrada</p>
            <p className="text-xs text-slate-400 mt-1">
              Quando os clientes solicitarem orçamentos ou autorizarem a impressão via portal, eles aparecerão aqui.
            </p>
          </div>
        ) : (
          filtered.map((quote) => {
            const qId = quote.id || quote._id || '';
            const isDirectPrint = quote.clientDecision === 'direct_print';
            const mw = quote.makerWorldData;
            const isRevised = !!quote.isRevised;
            const originalVal = quote.originalPrice ?? quote.calculation?.salePriceCash ?? 0;
            const currentVal = quote.calculation?.finalPriceWithShipping || quote.calculation?.salePriceCash || 0;
            const priceDiff = currentVal - originalVal;

            return (
              <div
                key={qId}
                className={`bg-white rounded-xl border p-5 shadow-xs transition-all space-y-4 ${
                  isRevised ? 'border-blue-200 ring-1 ring-blue-100 hover:border-blue-300' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
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
                        {isRevised && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-300">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                            <span>REVISADO PELO MAKER</span>
                          </span>
                        )}

                        {isDirectPrint ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <Rocket className="w-3.5 h-3.5 text-emerald-600" />
                            <span>PODE IMPRIMIR!</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
                            <Clock className="w-3.5 h-3.5 text-blue-600" />
                            <span>CONFIRMAR ORÇAMENTO FINAL</span>
                          </span>
                        )}

                        <span className="text-xs text-slate-400 font-mono">#{quote.quoteNumber}</span>
                        <span className="text-xs text-slate-400">• {quote.date}</span>
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

                  {/* Right: Value & Status */}
                  <div className="text-left sm:text-right space-y-1 shrink-0">
                    {isRevised ? (
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
                        {Math.abs(priceDiff) >= 0.05 && (
                          <span className={`text-[10px] font-bold ${priceDiff > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                            {priceDiff > 0 ? `+${formatCurrency(priceDiff)}` : `-${formatCurrency(Math.abs(priceDiff))}`}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider font-mono">
                          Valor Estimado
                        </span>
                        <div className="text-2xl font-black font-mono text-slate-900">
                          {formatCurrency(currentVal)}
                        </div>
                      </div>
                    )}

                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        quote.status === 'approved'
                          ? 'bg-emerald-50 text-emerald-700'
                          : quote.status === 'in_production'
                          ? 'bg-amber-50 text-amber-700'
                          : quote.status === 'completed'
                          ? 'bg-purple-50 text-purple-700'
                          : quote.status === 'revised'
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      Status: {
                        quote.status === 'approved'
                          ? 'Aprovado'
                          : quote.status === 'in_production'
                          ? 'Em Produção'
                          : quote.status === 'completed'
                          ? 'Concluído'
                          : quote.status === 'revised'
                          ? 'Revisado pelo Maker'
                          : 'Pendente'
                      }
                    </span>
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
                    <strong className="text-slate-900 text-sm block">{quote.customerName}</strong>
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
                      Cores & Filamentos Selecionados pelo Cliente:
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
                              <span className="font-mono">{f.usedG}g</span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <span className="text-slate-500 italic text-xs">Especificação padrão da peça</span>
                    )}
                  </div>
                </div>

                {/* Maker Action Controls */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
                  <div className="flex flex-wrap items-center gap-2">
                    
                    {/* Primary Maker Revision Button */}
                    <button
                      onClick={() => setRevisingQuote(quote)}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      <span>{isRevised ? 'Editar Orçamento Real' : 'Ajustar Orçamento Real (Revisar)'}</span>
                    </button>

                    {/* WhatsApp Button with Revised Format */}
                    {isRevised ? (
                      <button
                        onClick={() => handleSendRevisedWhatsApp(quote)}
                        className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                        title="Enviar proposta com valor antigo vs novo no WhatsApp"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Enviar Novo Valor no WhatsApp 📲</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleOpenWhatsApp(quote)}
                        className="px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Chamar no Zap</span>
                      </button>
                    )}

                    <button
                      onClick={() => onUpdateStatus(qId, 'in_production')}
                      disabled={quote.status === 'in_production'}
                      className="px-3 py-2 rounded-xl text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      ▶️ Em Produção
                    </button>

                    <button
                      onClick={() => onUpdateStatus(qId, 'completed')}
                      disabled={quote.status === 'completed'}
                      className="px-3 py-2 rounded-xl text-xs font-semibold bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      ✅ Concluir
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedQuote(quote)}
                      className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      <span>Ver Proposta A4</span>
                    </button>

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
