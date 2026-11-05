import React from 'react';
import { SavedQuote, Material, Printer, AuthUser } from '../lib/types';
import { formatCurrency } from '../lib/calculator';
import { MessageSquare, Lock } from 'lucide-react';

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

  // Financial summary
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
        <span className="stamp-badge text-xs font-bold px-2.5 py-0.5 rounded">
          ✓ Valor Real Confirmado
        </span>
      );
    }

    switch (status) {
      case 'in_production':
        return (
          <span className="stamp-badge text-xs font-bold px-2.5 py-0.5 rounded border-blue-700 text-blue-900 bg-blue-50">
            ● Em Produção 3D
          </span>
        );
      case 'completed':
        return (
          <span className="stamp-badge text-xs font-bold px-2.5 py-0.5 rounded">
            ✓ Pronto / Concluído
          </span>
        );
      case 'approved':
        return (
          <span className="stamp-badge text-xs font-bold px-2.5 py-0.5 rounded">
            ▶ Aprovado para Produção
          </span>
        );
      case 'cancelled':
        return (
          <span className="font-mono-tech text-xs font-bold px-2 py-0.5 bg-[#E4DED5] text-[#554B3E] rounded border border-[#6E6356]">
            Cancelado
          </span>
        );
      case 'pending_review':
      default:
        return (
          <span className="font-mono-tech text-xs font-bold px-2 py-0.5 bg-[#D6C3A9] text-[#221E1B] border border-[#5A4E40] rounded">
            {decision === 'direct_print' ? 'Fila de Impressão' : 'Aguardando Maker'}
          </span>
        );
    }
  };

  return (
    <section className="space-y-6">
      
      {/* Cabeçalho dos Pedidos + Resumo Financeiro Compacto */}
      <div className="paper-card p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <span className="font-mono-tech text-xs font-bold uppercase text-[#5C5349]">
            HISTÓRICO DE ORDENS DE SERVIÇO
          </span>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[#221E1B]">
            Meus Pedidos & Orçamentos
          </h1>
          <p className="text-sm text-[#5C5349]">
            Acompanhe o andamento das suas solicitações, valores revisados e status de pagamento.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="metric-box px-4 py-2.5">
            <span className="block font-mono-tech text-[10px] uppercase text-[#5C5349]">
              PENDENTE DE PAGAMENTO
            </span>
            <strong className="font-heading text-xl font-bold text-[#221E1B]">
              {formatCurrency(totalPendingPayment)}
            </strong>
          </div>

          <div className="metric-box px-4 py-2.5 border-[#1E3E24] bg-[#E3ECE4]">
            <span className="block font-mono-tech text-[10px] uppercase text-[#1E3E24] font-bold">
              STATUS DOS PAGAMENTOS
            </span>
            <strong className="font-heading text-sm font-bold text-[#1E3E24]">
              {countPending > 0
                ? `${countPending} aguardando pagamento`
                : `✓ Todos em dia (${countPaid} pago${countPaid !== 1 ? 's' : ''})`}
            </strong>
          </div>

          <button
            type="button"
            onClick={onOpenMakerWorld}
            className="btn-forest px-4 py-3 font-heading font-bold text-sm cursor-pointer whitespace-nowrap"
          >
            + Novo Orçamento MakerWorld
          </button>
        </div>
      </div>

      {/* Lista de Ordens de Produção */}
      {myQuotes.length === 0 ? (
        <div className="paper-card p-10 text-center space-y-3">
          <h3 className="font-heading text-xl font-bold text-[#221E1B]">
            Nenhum pedido registrado ainda
          </h3>
          <p className="text-sm text-[#5C5349]">
            Cole qualquer link do MakerWorld na aba de Orçador para simular e solicitar sua primeira peça.
          </p>
          <button
            type="button"
            onClick={onOpenMakerWorld}
            className="btn-forest px-5 py-2.5 font-heading font-bold text-sm inline-block cursor-pointer mt-2"
          >
            Orçar Peça no MakerWorld
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {myQuotes.map((q) => {
            const isMw = !!q.makerWorldData;
            const isDirectPrint = q.clientDecision === 'direct_print';
            const isPaid = q.paymentStatus === 'paid';
            const quantity = q.quantity || 1;
            const finalVal = q.calculation?.finalPriceWithShipping || q.calculation?.salePriceCash || 0;

            return (
              <div
                key={q.id || q._id}
                className="paper-card p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono-tech text-xs font-bold bg-[#221E1B] text-[#F6F3EC] px-2 py-0.5 rounded">
                      #{q.quoteNumber}
                    </span>
                    <span className="font-mono-tech text-xs text-[#5C5349]">{q.date}</span>
                    {getStatusBadge(q.status, q.clientDecision, q.isRevised)}
                    {isPaid ? (
                      <span className="stamp-badge text-xs font-bold px-2 py-0.5 rounded bg-[#1E3E24] text-[#F6F3EC]">
                        ✓ PAGO
                      </span>
                    ) : (
                      <span className="stamp-badge text-xs font-bold px-2 py-0.5 rounded border-amber-800 text-amber-900 bg-amber-50">
                        ● AGUARDANDO PAGAMENTO
                      </span>
                    )}
                    {quantity > 1 && (
                      <span className="font-mono-tech text-xs font-bold px-2 py-0.5 bg-[#D6C3A9] border border-[#5A4E40] rounded text-[#221E1B]">
                        Qtd: {quantity}
                      </span>
                    )}
                  </div>

                  <h3 className="font-heading text-xl font-bold text-[#221E1B]">
                    {isMw ? q.makerWorldData?.modelTitle : q.customerName}
                  </h3>

                  <div className="text-xs text-[#5C5349] flex flex-wrap items-center gap-2">
                    {q.isRevised ? (
                      <span>Valor técnico revisado pelo Maker</span>
                    ) : (
                      <span>Aguardando conferência técnica final pelo Maker</span>
                    )}
                    {isMw && q.makerWorldData?.sourceUrl && (
                      <>
                        <span>•</span>
                        <a
                          href={q.makerWorldData.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#1E3E24] font-semibold underline inline-flex items-center gap-1"
                        >
                          <span>Ver modelo no MakerWorld ↗</span>
                        </a>
                      </>
                    )}
                  </div>

                  {q.isRevised && (
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          const targetUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
                            `Olá! Vi o orçamento revisado #${q.quoteNumber} (${
                              q.makerWorldData?.modelTitle || 'Peça 3D'
                            }) no valor de ${formatCurrency(finalVal)}. Podemos produzir!`
                          )}`;
                          window.open(targetUrl, '_blank');
                        }}
                        className="btn-forest inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Falar com o Maker no WhatsApp</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="w-full md:w-auto flex flex-wrap sm:flex-nowrap items-center justify-between md:justify-end gap-4 pt-3 md:pt-0 border-t md:border-t-0 border-[#D5CBB8]">
                  <div className="text-left md:text-right font-mono-tech text-xs space-y-0.5">
                    <div>
                      <span className="text-[#5C5349]">Opção: </span>
                      <strong className="text-[#1E3E24]">
                        {isDirectPrint ? '▶ Pode Imprimir' : '📋 Confirmar Orçamento'}
                      </strong>
                    </div>
                    {isMw && q.makerWorldData?.filaments && (
                      <div>
                        <span className="text-[#5C5349]">Material: </span>
                        <strong>
                          {q.makerWorldData.filaments.map((f) => f.customColorName || f.originalType).join(', ')}
                        </strong>
                      </div>
                    )}
                  </div>

                  <div className="price-inset px-4 py-2 text-right">
                    <span className="block font-mono-tech text-[10px] uppercase text-[#5C5349]">
                      {q.isRevised ? 'VALOR REVISADO' : 'VALOR ESTIMADO'}
                    </span>
                    <strong className="font-heading text-2xl font-bold text-[#1E3E24]">
                      {formatCurrency(finalVal)}
                    </strong>
                  </div>

                  {q.status !== 'in_production' && q.status !== 'completed' ? (
                    <button
                      type="button"
                      onClick={() => handleDeleteQuote(q)}
                      className="px-3 py-2 border border-[#9E3B33] text-[#9E3B33] hover:bg-[#9E3B33] hover:text-white rounded font-mono-tech text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Excluir
                    </button>
                  ) : (
                    <span
                      className="p-2 text-[#8E8070] cursor-not-allowed inline-flex items-center"
                      title="Item já em produção na oficina"
                    >
                      <Lock className="w-4 h-4" />
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

    </section>
  );
};
