import React, { useState } from 'react';
import { SavedQuote, Material, Printer } from '../lib/types';
import { formatCurrency } from '../lib/calculator';
import { ProposalModal } from './ProposalModal';
import { FileText, Copy, Check, Trash2, Eye, Search, Download } from 'lucide-react';

interface QuotesTabProps {
  quotes: SavedQuote[];
  materials: Material[];
  printers: Printer[];
  onDeleteQuote: (id: string) => Promise<void>;
}

export const QuotesTab: React.FC<QuotesTabProps> = ({
  quotes,
  materials,
  printers,
  onDeleteQuote,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedQuote, setSelectedQuote] = useState<SavedQuote | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredQuotes = quotes.filter(
    (q) =>
      q.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.quoteNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCopyWhatsApp = (quote: SavedQuote) => {
    const text = `*Orçamento de Impressão 3D #${quote.quoteNumber}*
Cliente: ${quote.customerName || 'Cliente'}

Itens:
${quote.items
  .map((i) => {
    const mat = materials.find((m) => m.id === i.materialId);
    return `• *${i.name || 'Peça'}*: ${i.weightGrams}g (${mat?.name || 'PLA'}) - Tempo: ${i.printHours}h ${i.printMinutes}m`;
  })
  .join('\n')}

💰 *Total à Vista (PIX):* ${formatCurrency(quote.calculation.salePriceCash)}
${quote.calculation.shippingCost > 0 ? `📦 *Frete:* ${formatCurrency(quote.calculation.shippingCost)}\n*Total com Entrega:* ${formatCurrency(quote.calculation.finalPriceWithShipping)}` : ''}

Prazo de produção: 1 a 2 dias úteis.`;

    navigator.clipboard.writeText(text);
    setCopiedId(quote.id || 'current');
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleExportBackup = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(quotes, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `3dcost_orcamentos_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      
      {/* Top banner with search and backup button */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <span>Histórico de Orçamentos Salvos</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Consulte e gerencie propostas enviadas aos clientes com snapshots financeiros salvos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por cliente ou código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[220px]"
            />
          </div>

          <button
            onClick={handleExportBackup}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium cursor-pointer shadow-2xs transition-colors shrink-0"
            title="Exportar todos os orçamentos em JSON"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Backup JSON</span>
          </button>
        </div>
      </div>

      {/* Quotes Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        {filteredQuotes.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <FileText className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">Nenhum orçamento encontrado</p>
            <p className="text-xs text-slate-400">
              Vá até a aba "Orçador & Calculadora" e clique em "Salvar no Histórico" para registrar seu primeiro pedido.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Código</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Data</th>
                  <th className="py-3 px-4">Peças</th>
                  <th className="py-3 px-4 text-right">Custo Direto</th>
                  <th className="py-3 px-4 text-right">Margem %</th>
                  <th className="py-3 px-4 text-right">Preço de Venda</th>
                  <th className="py-3 px-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredQuotes.map((q) => {
                  const id = q.id || q._id || '';
                  const isCopied = copiedId === id;
                  return (
                    <tr key={id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-blue-600">
                        #{q.quoteNumber}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        <span>{q.customerName || 'Cliente'}</span>
                        {q.customerPhone && (
                          <span className="text-[11px] font-mono text-slate-400 block font-normal">
                            {q.customerPhone}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">
                        {q.date || '-'}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <span className="truncate max-w-[180px] block" title={q.items.map((i) => i.name).join(', ')}>
                          {q.items.map((i) => i.name).join(', ')} ({q.items.length})
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600">
                        {formatCurrency(q.calculation?.totalProductionCost || 0)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                        {q.profitMarginPercent}%
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 text-sm">
                        {formatCurrency(q.calculation?.finalPriceWithShipping || q.calculation?.salePriceCash || 0)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setSelectedQuote(q)}
                            className="p-1.5 rounded-md text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Ver Proposta A4"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleCopyWhatsApp(q)}
                            className="p-1.5 rounded-md text-slate-500 hover:text-emerald-600 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Copiar para WhatsApp"
                          >
                            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => onDeleteQuote(id)}
                            className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Excluir Orçamento"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Proposal View Modal */}
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
