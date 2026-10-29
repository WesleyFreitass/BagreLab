import React from 'react';
import { SavedQuote, Material, Printer, AuthUser } from '../lib/types';
import { formatCurrency } from '../lib/calculator';
import {
  Package,
  Clock,
  CheckCircle2,
  Rocket,
  MessageSquare,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

interface MyRequestsTabProps {
  quotes: SavedQuote[];
  currentUser: AuthUser;
  materials: Material[];
  printers: Printer[];
  onOpenMakerWorld: () => void;
}

export const MyRequestsTab: React.FC<MyRequestsTabProps> = ({
  quotes,
  currentUser,
  onOpenMakerWorld,
}) => {

  // Filter quotes belonging to this client (by email or phone)
  const clientCleanPhone = currentUser.phone ? currentUser.phone.replace(/\D/g, '') : '';
  const myQuotes = quotes.filter((q) => {
    const qCleanPhone = q.customerPhone ? q.customerPhone.replace(/\D/g, '') : '';
    const matchEmail = currentUser.email && q.customerEmail && q.customerEmail.toLowerCase() === currentUser.email.toLowerCase();
    const matchPhone = clientCleanPhone && qCleanPhone && (clientCleanPhone.includes(qCleanPhone) || qCleanPhone.includes(clientCleanPhone));
    return matchEmail || matchPhone;
  });

  const getStatusBadge = (status: SavedQuote['status'], decision?: string) => {
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
            <Rocket className="w-3.5 h-3.5 text-emerald-600" />
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
            Acompanhe o andamento das suas solicitações, confira propostas e fale com o Maker.
          </p>
        </div>

        <button
          onClick={onOpenMakerWorld}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2.5 rounded-lg shadow-2xs transition-colors cursor-pointer shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          <span>Fazer Novo Orçamento MakerWorld</span>
        </button>
      </div>

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
            <Sparkles className="w-4 h-4" />
            <span>Orçar Peça no MakerWorld</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {myQuotes.map((q) => {
            const isMw = !!q.makerWorldData;
            const isDirectPrint = q.clientDecision === 'direct_print';

            return (
              <div
                key={q.id || q._id}
                className="bg-white rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs font-bold text-slate-900">
                          #{q.quoteNumber}
                        </span>
                        <span className="text-[10px] text-slate-400">{q.date}</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 line-clamp-1">
                        {isMw ? q.makerWorldData?.modelTitle : q.customerName}
                      </h4>
                    </div>

                    <div>{getStatusBadge(q.status, q.clientDecision)}</div>
                  </div>

                  {/* Decision Tag */}
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
                            <Rocket className="w-3.5 h-3.5" />
                            <span>Pode Imprimir!</span>
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

                    <div className="flex items-center justify-between font-mono text-xs pt-1">
                      <span className="text-slate-500 font-sans">Valor do Orçamento:</span>
                      <strong className="text-slate-900 text-sm">
                        {formatCurrency(q.calculation.salePriceCash)}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-400">
                    Acompanhamento pelo Maker via WhatsApp
                  </span>

                  {isMw && q.makerWorldData?.sourceUrl && (
                    <a
                      href={q.makerWorldData.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline font-medium"
                    >
                      <span>Ver no MakerWorld</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
