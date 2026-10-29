import React from 'react';
import { SavedQuote, Material, Printer, AuthUser } from '../lib/types';
import { formatCurrency } from '../lib/calculator';
import {
  Package,
  Clock,
  CheckCircle2,
  Play,
  MessageSquare,
  ExternalLink,
  Wrench,
  CreditCard,
  Layers,
  Trash2,
  Lock,
} from 'lucide-react';

interface MyRequestsTabProps {
  quotes: SavedQuote[];
  currentUser: AuthUser;
  materials: Material[];
  printers: Printer[];
  onOpenMakerWorld: () => void;
  onDeleteQuote?: (id: string) => Promise<void>;
}

export const MyRequestsTab: React.FC<MyRequestsTabProps> = ({
  quotes,
  currentUser,
  onOpenMakerWorld,
  onDeleteQuote,
}) => {
  // Filter quotes belonging to this client (by email or phone)
  const clientCleanPhone = currentUser.phone ? currentUser.phone.replace(/\D/g, '') : '';
  const myQuotes = quotes.filter((q) => {
    const qCleanPhone = q.customerPhone ? q.customerPhone.replace(/\D/g, '') : '';
    const matchEmail =
      currentUser.email && q.customerEmail && q.customerEmail.toLowerCase() === currentUser.email.toLowerCase();
    const matchPhone =
      clientCleanPhone && qCleanPhone && (clientCleanPhone.includes(qCleanPhone) || qCleanPhone.includes(clientCleanPhone));
    return matchEmail || matchPhone;
  });

  // Financial summary for this client:
  const totalPendingPayment = myQuotes
    .filter((q) => q.status !== 'cancelled' && q.paymentStatus !== 'paid')
    .reduce((sum, q) => sum + (q.calculation?.finalPriceWithShipping || q.calculation?.salePriceCash || 0), 0);

  const countPending = myQuotes.filter((q) => q.status !== 'cancelled' && q.paymentStatus !== 'paid').length;
  const countPaid = myQuotes.filter((q) => q.paymentStatus === 'paid').length;

  const handleDeleteQuote = async (q: SavedQuote) => {
    if (q.status === 'in_production' || q.status === 'completed') {
      alert('Não é possível excluir pedidos que já iniciaram a impressão na oficina.');
      return;
    }
    const qId = q.id || q._id;
    if (!qId || !onDeleteQuote) return;
    const title = q.makerWorldData?.modelTitle || q.customerName || 'este pedido';
    if (window.confirm(`Deseja realmente cancelar e excluir o pedido #${q.quoteNumber} (${title})?`)) {
      await onDeleteQuote(qId);
    }
  };

  const getStatusBadge = (status: SavedQuote['status'], decision?: string, isRevised?: boolean) => {
    if (isRevised) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
          <Wrench className="w-3.5 h-3.5 text-indigo-600" />
          <span>Valor Real Confirmado</span>
        </span>
      );
    }

    switch (status) {
      case 'in_production':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
            <span>Em Produção 3D</span>
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Pronto / Concluído</span>
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Play className="w-3.5 h-3.5 text-emerald-600" />
            <span>Aprovado para Produção</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            Cancelado
          </span>
        );
      case 'pending_review':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>{decision === 'direct_print' ? 'Fila de Impressão' : 'Aguardando Revisão do Maker'}</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Package className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Meus Pedidos & Orçamentos
            </h2>
          </div>
          <p className="text-sm text-slate-500">
            Acompanhe o andamento das suas solicitações, valores revisados e status de pagamento.
          </p>
        </div>

        <button
          onClick={onOpenMakerWorld}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2.5 rounded-lg shadow-2xs transition-colors cursor-pointer shrink-0"
        >
          <Package className="w-4 h-4" />
          <span>Fazer Novo Orçamento MakerWorld</span>
        </button>
      </div>

      {/* Financial Status Summary for Client */}
      {myQuotes.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 font-mono block">
                Total Pendente de Pagamento
              </span>
              <div className="text-2xl font-black font-mono text-amber-950 mt-0.5">
                {formatCurrency(totalPendingPayment)}
              </div>
              <span className="text-[11px] text-amber-800">
                {countPending > 0
                  ? `${countPending} pedido(s) aguardando pagamento`
                  : 'Nenhum valor pendente'}
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono block">
                Status dos Pagamentos
              </span>
              <div className="text-xs font-semibold text-slate-800 mt-1">
                {countPending > 0 ? (
                  <span className="text-amber-800 font-bold">Aguardando pagamento / Chave PIX com o Maker</span>
                ) : (
                  <span className="text-emerald-700 font-bold">Todos os pedidos estão em dia ({countPaid} pagos)</span>
                )}
              </div>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                A baixa do pagamento é realizada pelo Maker da oficina
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-200/70 text-slate-700 flex items-center justify-center shrink-0">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
        </div>
      )}

      {/* Orders List */}
      {myQuotes.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 text-slate-400 mx-auto flex items-center justify-center">
            <Package className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">
              Nenhum pedido encontrado ainda
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              Cole o link de qualquer modelo do MakerWorld na aba de Orçador para calcular na hora e nos enviar para impressão!
            </p>
          </div>
          <button
            onClick={onOpenMakerWorld}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2.5 rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <Package className="w-4 h-4" />
            <span>Orçar Peça no MakerWorld</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {myQuotes.map((q) => {
            const isMw = !!q.makerWorldData;
            const isDirectPrint = q.clientDecision === 'direct_print';
            const isPaid = q.paymentStatus === 'paid';
            const quantity = q.quantity || 1;

            return (
              <div
                key={q.id || q._id}
                className="bg-white rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-mono text-xs font-bold text-slate-900">
                          #{q.quoteNumber}
                        </span>
                        <span className="text-[10px] text-slate-400">{q.date}</span>

                        {/* Quantity Badge */}
                        {quantity > 1 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                            <Layers className="w-3 h-3 text-slate-400" />
                            <span>{quantity} un.</span>
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 line-clamp-1">
                        {isMw ? q.makerWorldData?.modelTitle : q.customerName}
                      </h4>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      {getStatusBadge(q.status, q.clientDecision, q.isRevised)}
                      {isPaid ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 font-mono">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>PAGO</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 font-mono">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>PAGAMENTO PENDENTE</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Decision Tag & Pricing */}
                  <div className="py-3 text-xs space-y-2 border-b border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Opção Escolhida:</span>
                      <span
                        className={`font-semibold inline-flex items-center gap-1 ${
                          isDirectPrint ? 'text-emerald-700' : 'text-blue-700'
                        }`}
                      >
                        {isDirectPrint ? (
                          <>
                            <Play className="w-3.5 h-3.5" />
                            <span>Pode Imprimir</span>
                          </>
                        ) : (
                          <>
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Confirmar Orçamento Final</span>
                          </>
                        )}
                      </span>
                    </div>

                    {isMw && q.makerWorldData?.filaments && (
                      <div className="text-[11px] text-slate-500">
                        <span>Cores/Filamentos: </span>
                        <strong className="text-slate-700">
                          {q.makerWorldData.filaments.map((f) => f.customColorName || f.originalType).join(', ')}
                        </strong>
                      </div>
                    )}

                    {/* Old vs New Value Display if revised */}
                    {q.isRevised ? (
                      <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 space-y-1.5 mt-2">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-slate-500 font-sans">Estimativa Inicial:</span>
                          <span className="text-slate-400 line-through">
                            {formatCurrency(q.originalPrice ?? q.calculation.salePriceCash)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between font-mono text-sm border-t border-emerald-200/80 pt-1">
                          <span className="text-emerald-950 font-sans font-bold flex items-center gap-1 text-xs">
                            <Wrench className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Valor Real Confirmado:</span>
                          </span>
                          <strong className="text-emerald-700 text-base font-black">
                            {formatCurrency(q.calculation?.finalPriceWithShipping || q.calculation?.salePriceCash || 0)}
                          </strong>
                        </div>
                        {q.revisionNotes && (
                          <div className="pt-1.5 border-t border-emerald-100 text-[11px] text-emerald-950 leading-snug">
                            <span className="font-bold text-emerald-900 block font-mono text-[10px] uppercase">
                              Observação do Maker:
                            </span>
                            <span className="italic text-slate-700">"{q.revisionNotes}"</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-between font-mono text-xs pt-1">
                        <span className="text-slate-500 font-sans">Valor Estimado:</span>
                        <strong className="text-slate-900 text-sm">
                          {formatCurrency(q.calculation.salePriceCash)}
                        </strong>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions & Delete Control */}
                <div className="pt-4 flex items-center justify-between gap-3 flex-wrap border-t border-slate-100 mt-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {q.isRevised ? (
                      <button
                        onClick={() => {
                          const targetUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
                            `Olá Wesley! Vi a atualização do orçamento #${q.quoteNumber} (Peça: ${
                              q.makerWorldData?.modelTitle || 'Impressão 3D'
                            }) para ${formatCurrency(
                              q.calculation?.finalPriceWithShipping || q.calculation?.salePriceCash || 0
                            )}. Podemos prosseguir!`
                          )}`;
                          window.open(targetUrl, '_blank');
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors cursor-pointer shadow-2xs"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Falar com o Maker no WhatsApp</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400">
                        Aguardando conferência técnica pelo Maker
                      </span>
                    )}

                    {isMw && q.makerWorldData?.sourceUrl && (
                      <a
                        href={q.makerWorldData.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline font-medium ml-1"
                      >
                        <span>Ver no MakerWorld</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {q.status !== 'in_production' && q.status !== 'completed' ? (
                      <button
                        onClick={() => handleDeleteQuote(q)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 text-xs font-semibold transition-colors cursor-pointer"
                        title="Excluir este pedido antes de iniciar a impressão na oficina"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Excluir Pedido</span>
                      </button>
                    ) : (
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-500 text-[11px] font-medium border border-slate-200"
                        title="Este item já começou a ser impresso na oficina ou foi concluído e não pode ser cancelado."
                      >
                        <Lock className="w-3 h-3 text-slate-400" />
                        <span>{q.status === 'in_production' ? 'Impressão já iniciada' : 'Pedido concluído'}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
