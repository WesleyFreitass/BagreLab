import React, { useState } from 'react';
import { SavedQuote, Material, Printer, AuthUser } from '../lib/types';
import { formatCurrency } from '../lib/calculator';
import { PIPELINE_STAGES, PipelineStageKey, getQuoteStage } from '../lib/pipeline';
import { MessageSquare, Lock, Check, Zap } from 'lucide-react';
import { PixPaymentModal } from './PixPaymentModal';

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
  const [payingQuote, setPayingQuote] = useState<SavedQuote | null>(null);

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
    const stage = getQuoteStage(q);
    if (stage === 'in_production' || stage === 'completed') {
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

  const pipelineSteps: { key: PipelineStageKey; label: string; number: number }[] = [
    { key: 'pending_review', label: '1. Análise', number: 1 },
    { key: 'awaiting_payment', label: '2. Pagamento', number: 2 },
    { key: 'queued', label: '3. Fila', number: 3 },
    { key: 'in_production', label: '4. Produção', number: 4 },
    { key: 'completed', label: '5. Pronto', number: 5 },
  ];

  const getStageDescription = (stage: PipelineStageKey, isRevised?: boolean) => {
    switch (stage) {
      case 'pending_review':
        return 'O Maker está conferindo os parâmetros no software fatiador para confirmar seu orçamento.';
      case 'awaiting_payment':
        return isRevised
          ? 'Orçamento revisado tecnicamente pelo Maker! Aguardando confirmação do pagamento.'
          : 'Orçamento aprovado pelo Maker! Aguardando pagamento para entrar na fila de impressão.';
      case 'queued':
        return 'Pagamento confirmado! Sua peça está na fila da bancada para a próxima impressora disponível.';
      case 'in_production':
        return 'Sua peça está sendo impressa agora mesmo na máquina 3D!';
      case 'completed':
        return 'Impressão concluída com sucesso! Sua peça está pronta para entrega ou retirada.';
      case 'cancelled':
        return 'Este pedido foi cancelado.';
      default:
        return 'Em processamento na oficina.';
    }
  };

  return (
    <section className="space-y-6">
      
      {/* Cabeçalho dos Pedidos + Resumo Financeiro Compacto */}
      <div className="paper-card p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <span className="font-mono-tech text-xs font-bold uppercase text-[#5C5349]">
            ACOMPANHAMENTO DE ORDENS DE SERVIÇO
          </span>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[#221E1B]">
            Meus Pedidos & Orçamentos
          </h1>
          <p className="text-sm text-[#5C5349]">
            Acompanhe o andamento das suas impressões 3D em tempo real, desde a análise até a conclusão.
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
            const stage = getQuoteStage(q);
            const stageConfig = PIPELINE_STAGES[stage] || PIPELINE_STAGES.pending_review;

            return (
              <div
                key={q.id || q._id}
                className="paper-card p-5 sm:p-6 space-y-4"
              >
                {/* Header Row */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono-tech text-xs font-bold bg-[#221E1B] text-[#F6F3EC] px-2 py-0.5 rounded">
                        #{q.quoteNumber}
                      </span>
                      <span className="font-mono-tech text-xs text-[#5C5349]">{q.date}</span>

                      {/* Prominent Stage Badge */}
                      <span
                        className={`font-mono-tech text-xs font-bold px-2.5 py-0.5 rounded border ${stageConfig.badgeBg} ${stageConfig.badgeText} ${stageConfig.badgeBorder}`}
                      >
                        {stageConfig.label}
                      </span>

                      {/* Payment Status */}
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

                    <p className="text-xs text-[#5C5349]">
                      {getStageDescription(stage, q.isRevised)}
                    </p>
                  </div>

                  {/* Price & Primary Action */}
                  <div className="w-full md:w-auto flex flex-wrap sm:flex-nowrap items-center justify-between md:justify-end gap-4 pt-3 md:pt-0 border-t md:border-t-0 border-[#D5CBB8]">
                    <div className="price-inset px-4 py-2 text-right">
                      <span className="block font-mono-tech text-[10px] uppercase text-[#5C5349]">
                        {q.isRevised ? 'VALOR REVISADO' : 'VALOR ESTIMADO'}
                      </span>
                      <strong className="font-heading text-2xl font-bold text-[#1E3E24]">
                        {formatCurrency(finalVal)}
                      </strong>
                    </div>

                    {stage !== 'in_production' && stage !== 'completed' ? (
                      <button
                        type="button"
                        onClick={() => handleDeleteQuote(q)}
                        className="px-3 py-2 border border-[#9E3B33] text-[#9E3B33] hover:bg-[#9E3B33] hover:text-white rounded font-mono-tech text-xs font-semibold transition-colors cursor-pointer"
                        title="Cancelar e excluir solicitação"
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

                {/* 5-Step Visual Stepper Bar */}
                <div className="bg-[#EFECE4] rounded-lg p-3 border border-[#D5CBB8]">
                  <div className="flex items-center justify-between text-xs font-mono-tech">
                    {pipelineSteps.map((step, idx) => {
                      const isCurrent = step.key === stage;
                      const isPast = stageConfig.stepNumber > step.number;

                      return (
                        <React.Fragment key={step.key}>
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                                isCurrent
                                  ? 'bg-[#1E3E24] text-[#F6F3EC] ring-2 ring-[#5A8561]'
                                  : isPast
                                  ? 'bg-[#1E3E24] text-[#F6F3EC]'
                                  : 'bg-[#D6C3A9] text-[#5C5349]'
                              }`}
                            >
                              {isPast ? <Check className="w-3.5 h-3.5" /> : step.number}
                            </span>
                            <span
                              className={`hidden sm:inline ${
                                isCurrent
                                  ? 'font-bold text-[#1E3E24]'
                                  : isPast
                                  ? 'font-semibold text-[#221E1B]'
                                  : 'text-[#8E8070]'
                              }`}
                            >
                              {step.label}
                            </span>
                          </div>
                          {idx < pipelineSteps.length - 1 && (
                            <div
                              className={`h-0.5 flex-1 mx-2 sm:mx-3 ${
                                stageConfig.stepNumber > step.number ? 'bg-[#1E3E24]' : 'bg-[#D6C3A9]'
                              }`}
                            />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>

                {/* Revision Notes Callout if Quote was Revised */}
                {q.isRevised && q.revisionNotes && (
                  <div className="bg-[#E3ECE4] border border-[#B5CDB8] rounded-lg p-3 text-xs text-[#1E3E24] space-y-1">
                    <strong>Nota técnica do Maker:</strong>
                    <p className="italic">"{q.revisionNotes}"</p>
                  </div>
                )}

                {/* Bottom details & WhatsApp action */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#D5CBB8] text-xs">
                  <div className="flex flex-wrap items-center gap-3 text-[#5C5349]">
                    <span>
                      Modo: <strong className="text-[#221E1B]">{isDirectPrint ? 'Pode Imprimir' : 'Orçamento Solicitado'}</strong>
                    </span>
                    {isMw && q.makerWorldData?.sourceUrl && (
                      <a
                        href={q.makerWorldData.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#1E3E24] font-semibold underline inline-flex items-center gap-1"
                      >
                        <span>Ver modelo no MakerWorld ↗</span>
                      </a>
                    )}
                    {isMw && q.makerWorldData?.filaments && (
                      <span>
                        Material:{' '}
                        <strong className="text-[#221E1B]">
                          {q.makerWorldData.filaments.map((f) => f.customColorName || f.originalType).join(', ')}
                        </strong>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {!isPaid && (
                      <button
                        type="button"
                        onClick={() => setPayingQuote(q)}
                        className="btn-forest inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold cursor-pointer bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg shadow-2xs"
                      >
                        <Zap className="w-3.5 h-3.5 text-amber-300" />
                        <span>Pagar com Pix (QR Code)</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        const targetUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
                          `Olá! Gostaria de falar sobre meu pedido #${q.quoteNumber} (${
                            q.makerWorldData?.modelTitle || 'Peça 3D'
                          }) no valor de ${formatCurrency(finalVal)}.`
                        )}`;
                        window.open(targetUrl, '_blank');
                      }}
                      className="btn-forest inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Falar no WhatsApp</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Pagamento Pix */}
      {payingQuote && (
        <PixPaymentModal
          isOpen={Boolean(payingQuote)}
          onClose={() => setPayingQuote(null)}
          quote={payingQuote}
        />
      )}

    </section>
  );
};
