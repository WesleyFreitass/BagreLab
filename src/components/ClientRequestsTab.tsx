import React, { useState } from 'react';
import { SavedQuote, Material, Printer } from '../lib/types';
import { formatCurrency } from '../lib/calculator';
import { ProposalModal } from './ProposalModal';
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
} from 'lucide-react';

interface ClientRequestsTabProps {
  quotes: SavedQuote[];
  materials: Material[];
  printers: Printer[];
  onUpdateStatus: (id: string, status: SavedQuote['status']) => Promise<void>;
  onDeleteQuote: (id: string) => Promise<void>;
}

export const ClientRequestsTab: React.FC<ClientRequestsTabProps> = ({
  quotes,
  materials,
  printers,
  onUpdateStatus,
  onDeleteQuote,
}) => {
  const [filter, setFilter] = useState<'all' | 'direct_print' | 'confirm_quote' | 'in_production' | 'completed'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedQuote, setSelectedQuote] = useState<SavedQuote | null>(null);

  // Filter requests (quotes with clientDecision or makerWorldData or pending status)
  const clientQuotes = quotes.filter((q) => q.clientDecision || q.makerWorldData || q.status === 'pending_review');

  const filtered = clientQuotes.filter((q) => {
    const matchesSearch =
      q.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (q.customerPhone && q.customerPhone.includes(searchTerm)) ||
      (q.makerWorldData?.modelTitle && q.makerWorldData.modelTitle.toLowerCase().includes(searchTerm.toLowerCase())) ||
      q.quoteNumber.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (filter === 'direct_print') return q.clientDecision === 'direct_print';
    if (filter === 'confirm_quote') return q.clientDecision === 'confirm_quote';
    if (filter === 'in_production') return q.status === 'in_production';
    if (filter === 'completed') return q.status === 'completed';

    return true;
  });

  const countDirectPrint = clientQuotes.filter((q) => q.clientDecision === 'direct_print').length;
  const countConfirmQuote = clientQuotes.filter((q) => q.clientDecision === 'confirm_quote').length;

  const handleOpenWhatsApp = (q: SavedQuote) => {
    if (!q.customerPhone) return;
    let clean = q.customerPhone.replace(/\D/g, '');
    if (clean.length === 10 || clean.length === 11) clean = `55${clean}`;

    const text = q.clientDecision === 'direct_print'
      ? `Olá ${q.customerName}! Recebemos seu pedido com a opção *PODE IMPRIMIR* para o modelo "${q.makerWorldData?.modelTitle || 'Impressão 3D'}" (Orçamento #${q.quoteNumber}). Já estamos preparando os materiais para iniciar a produção!`
      : `Olá ${q.customerName}! Tudo bem? Recebemos sua solicitação de orçamento #${q.quoteNumber} para o modelo "${q.makerWorldData?.modelTitle || 'Impressão 3D'}". Estou entrando em contato para confirmar os detalhes finais!`;

    window.open(`https://api.whatsapp.com/send?phone=${clean}&text=${encodeURIComponent(text)}`, '_blank');
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
            Painel de controle para gerenciar solicitações recebidas, pedidos aprovados para impressão direta e contatos de clientes.
          </p>
        </div>

        <div className="flex items-center gap-2">
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
            onClick={() => setFilter('confirm_quote')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
              filter === 'confirm_quote'
                ? 'bg-blue-600 text-white'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
            }`}
          >
            Aguardando Confirmação ({countConfirmQuote})
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

            return (
              <div
                key={qId}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all space-y-4"
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
                      <div className="flex items-center gap-2">
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
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                      Valor Estimado
                    </span>
                    <div className="text-2xl font-black font-mono text-slate-900">
                      {formatCurrency(quote.calculation?.finalPriceWithShipping || quote.calculation?.salePriceCash || 0)}
                    </div>
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        quote.status === 'approved'
                          ? 'bg-emerald-50 text-emerald-700'
                          : quote.status === 'in_production'
                          ? 'bg-amber-50 text-amber-700'
                          : quote.status === 'completed'
                          ? 'bg-purple-50 text-purple-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      Status: {quote.status === 'approved' ? 'Aprovado' : quote.status === 'in_production' ? 'Em Produção' : quote.status === 'completed' ? 'Concluído' : 'Pendente'}
                    </span>
                  </div>
                </div>

                {/* Details Row: Client Info & Filament Colors */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs bg-slate-50/80 p-3.5 rounded-xl border border-slate-200/80">
                  {/* Client Info */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                      Dados do Cliente:
                    </span>
                    <strong className="text-slate-900 text-sm block">{quote.customerName}</strong>
                    {quote.customerPhone && (
                      <div className="flex items-center gap-2 font-mono text-slate-700">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{quote.customerPhone}</span>
                        <button
                          onClick={() => handleOpenWhatsApp(quote)}
                          className="px-2 py-0.5 rounded bg-emerald-600 text-white font-sans text-[11px] font-semibold hover:bg-emerald-700 transition-colors cursor-pointer flex items-center gap-1"
                          title="Abrir WhatsApp com o cliente"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>Chamar no WhatsApp</span>
                        </button>
                      </div>
                    )}
                    {quote.customerEmail && (
                      <span className="text-slate-500 block text-[11px]">E-mail: {quote.customerEmail}</span>
                    )}
                  </div>

                  {/* Filaments Chosen by Client */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
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
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onUpdateStatus(qId, 'in_production')}
                      disabled={quote.status === 'in_production'}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      ▶️ Iniciar Produção
                    </button>

                    <button
                      onClick={() => onUpdateStatus(qId, 'completed')}
                      disabled={quote.status === 'completed'}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      ✅ Marcar como Concluído
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedQuote(quote)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer flex items-center gap-1.5"
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
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
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

      {/* Proposal Modal Preview */}
      {selectedQuote && (
        <ProposalModal
          isOpen={Boolean(selectedQuote)}
          onClose={() => setSelectedQuote(null)}
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
