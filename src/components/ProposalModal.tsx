import React from 'react';
import { X, Printer as PrintIcon, Check, Copy } from 'lucide-react';
import { QuoteCalculationResult, QuoteItem, Material, Printer } from '../lib/types';
import { formatCurrency, formatHours } from '../lib/calculator';

interface ProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerName: string;
  quoteNumber: string;
  date: string;
  items: QuoteItem[];
  materials: Material[];
  printers: Printer[];
  calculation: QuoteCalculationResult;
  notes?: string;
}

export const ProposalModal: React.FC<ProposalModalProps> = ({
  isOpen,
  onClose,
  customerName,
  quoteNumber,
  date,
  items,
  materials,
  printers,
  calculation,
  notes,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopySummary = () => {
    const text = `*Orçamento de Impressão 3D #${quoteNumber}*
Cliente: ${customerName || 'Cliente'}
Data: ${date}

Itens:
${items
  .map((i) => {
    const mat = materials.find((m) => m.id === i.materialId);
    return `• ${i.name || 'Peça'}: ${i.weightGrams}g (${mat?.name || 'PLA'}) - Tempo: ${i.printHours}h ${i.printMinutes}m`;
  })
  .join('\n')}

*Total à Vista:* ${formatCurrency(calculation.salePriceCash)}
${calculation.shippingCost > 0 ? `Frete: ${formatCurrency(calculation.shippingCost)}\n*Total com Frete:* ${formatCurrency(calculation.finalPriceWithShipping)}` : ''}

Prazo de Produção: 1 a 2 dias úteis após aprovação.`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden flex flex-col my-8">
        
        {/* Modal Action Bar (Not printed) */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3.5 flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Visualização de Proposta Comercial
            </span>
            <span className="text-xs text-slate-500 font-mono">#{quoteNumber}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySummary}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 shadow-xs cursor-pointer transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copiado!' : 'Copiar Texto'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-xs cursor-pointer transition-colors"
            >
              <PrintIcon className="w-3.5 h-3.5" />
              <span>Imprimir / Salvar PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 cursor-pointer transition-colors ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* The Printable Document Body */}
        <div id="printable-quote" className="p-8 sm:p-12 space-y-8 bg-white text-slate-900">
          
          {/* Document Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between pb-6 border-b border-slate-200 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-xl shadow-sm">
                3D
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900">OFICINA 3D // PROPOSTA COMERCIAL</h1>
                <p className="text-xs text-slate-500">Serviços Especializados de Manufatura Aditiva & Prototipagem</p>
              </div>
            </div>

            <div className="text-left sm:text-right font-mono text-xs text-slate-600 space-y-0.5">
              <span className="font-bold text-slate-900 block text-sm">PROPOSTA Nº {quoteNumber}</span>
              <span>Emissão: {date || new Date().toLocaleDateString('pt-BR')}</span>
              <span className="block text-slate-500">Validade: 15 dias corridos</span>
            </div>
          </div>

          {/* Customer & Project Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-xs">
            <div>
              <span className="text-slate-400 block uppercase font-bold text-[10px] tracking-wider mb-0.5">Destinatário:</span>
              <strong className="text-slate-900 text-sm block">{customerName || 'Cliente'}</strong>
              <span className="text-slate-500">Orçamento formal sob demanda</span>
            </div>
            <div>
              <span className="text-slate-400 block uppercase font-bold text-[10px] tracking-wider mb-0.5">Especificação Técnica:</span>
              <span className="text-slate-800 block font-medium">Tecnologia FDM / Deposição de Filamento Fundido</span>
              <span className="text-slate-500">Camadas de alta resolução dimensional</span>
            </div>
          </div>

          {/* Items Table */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Itens da Proposta:
            </span>
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">Descrição do Item / Peça</th>
                    <th className="py-2.5 px-3">Material</th>
                    <th className="py-2.5 px-3">Máquina</th>
                    <th className="py-2.5 px-3 text-right">Massa</th>
                    <th className="py-2.5 px-4 text-right">Tempo Est.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {items.map((item, idx) => {
                    const mat = materials.find((m) => m.id === item.materialId);
                    const prn = printers.find((p) => p.id === item.printerId);
                    const hours = (Number(item.printDays) || 0) * 24 + (Number(item.printHours) || 0) + (Number(item.printMinutes) || 0) / 60;
                    return (
                      <tr key={item.id || idx} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {item.name || `Peça #${idx + 1}`}
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          {mat ? `${mat.name} (${mat.type})` : 'PLA'}
                        </td>
                        <td className="py-3 px-3 text-slate-600">
                          {prn ? prn.name : 'Padrão'}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-700">
                          {item.weightGrams}g
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-700">
                          {formatHours(hours)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Financial Settlement Box */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 pt-4 border-t border-slate-200 items-end">
            <div className="sm:col-span-7 space-y-2 text-xs text-slate-500">
              <strong className="text-slate-700 block">Condições Gerais de Fornecimento:</strong>
              <p>• Prazo de fabricação: 1 a 2 dias úteis após aprovação da ordem de serviço.</p>
              <p>• Pagamento à vista via PIX ou em até 2x no cartão de crédito.</p>
              {notes && <p className="text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200 mt-2"><strong>Observações:</strong> {notes}</p>}
            </div>

            <div className="sm:col-span-5 bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-2 text-right">
              <div className="flex justify-between text-xs text-slate-600">
                <span>Subtotal dos Serviços:</span>
                <span className="font-mono font-semibold text-slate-900">{formatCurrency(calculation.salePriceCash)}</span>
              </div>
              {calculation.shippingCost > 0 && (
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Frete / Logística:</span>
                  <span className="font-mono font-semibold text-slate-900">{formatCurrency(calculation.shippingCost)}</span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
                <span className="text-xs font-bold text-slate-700 uppercase">Valor Total:</span>
                <span className="text-2xl font-extrabold text-blue-600 font-mono">
                  {formatCurrency(calculation.finalPriceWithShipping)}
                </span>
              </div>
              <span className="text-[11px] text-slate-400 block">Preço à vista com encargos já inclusos</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
