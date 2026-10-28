import React, { useState } from 'react';
import { Printer } from '../lib/types';
import { formatCurrency } from '../lib/calculator';
import { Plus, Trash2, Edit2, X, Printer as PrinterIcon } from 'lucide-react';

interface PrintersTabProps {
  printers: Printer[];
  onSavePrinter: (printer: Partial<Printer>) => Promise<void>;
  onDeletePrinter: (id: string) => Promise<void>;
}

export const PrintersTab: React.FC<PrintersTabProps> = ({
  printers,
  onSavePrinter,
  onDeletePrinter,
}) => {
  const [editingPrinter, setEditingPrinter] = useState<Partial<Printer> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenAdd = () => {
    setEditingPrinter({
      name: '',
      price: 2500,
      maintenancePercent: 0.25,
      lifespanHours: 5000,
      powerKw: 0.125,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (printer: Printer) => {
    setEditingPrinter(printer);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPrinter || !editingPrinter.name) return;
    await onSavePrinter(editingPrinter);
    setIsModalOpen(false);
    setEditingPrinter(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Top banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <PrinterIcon className="w-5 h-5 text-blue-600" />
            <span>Gestão de Impressoras 3D</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cadastre suas máquinas. O sistema calcula automaticamente a depreciação por hora e o custo elétrico de cada uma.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs cursor-pointer transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Impressora</span>
        </button>
      </div>

      {/* Printers Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Nome da Impressora</th>
                <th className="py-3 px-4 text-right">Preço de Aquisição</th>
                <th className="py-3 px-4 text-right">Manutenção (25%)</th>
                <th className="py-3 px-4 text-right">Vida Útil</th>
                <th className="py-3 px-4 text-right">Consumo</th>
                <th className="py-3 px-4 text-right">Depreciação / Hora</th>
                <th className="py-3 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {printers.map((printer) => {
                const maintenanceCost = printer.price * (printer.maintenancePercent || 0.25);
                const depPerHour = printer.lifespanHours > 0 ? (printer.price + maintenanceCost) / printer.lifespanHours : 0;
                return (
                  <tr key={printer.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                        <PrinterIcon className="w-4 h-4" />
                      </div>
                      <span>{printer.name}</span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-medium text-slate-900">
                      {formatCurrency(printer.price)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-600">
                      {formatCurrency(maintenanceCost)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-600">
                      {printer.lifespanHours.toLocaleString('pt-BR')} horas
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-600">
                      {printer.powerKw * 1000} W ({printer.powerKw} kW)
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-blue-600">
                      {formatCurrency(depPerHour)} / hora
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(printer)}
                          className="p-1.5 rounded-md text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Editar"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeletePrinter(printer.id)}
                          className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Excluir"
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
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && editingPrinter && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                {editingPrinter.id ? 'Editar Impressora' : 'Cadastrar Nova Impressora'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Nome da Impressora / Modelo</label>
                <input
                  type="text"
                  required
                  value={editingPrinter.name || ''}
                  onChange={(e) => setEditingPrinter({ ...editingPrinter, name: e.target.value })}
                  placeholder="Ex: Bambu Lab P1S, Anycubic Kobra..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Preço de Aquisição (R$)</label>
                  <input
                    type="number"
                    step="10"
                    min="0"
                    required
                    value={editingPrinter.price || 0}
                    onChange={(e) => setEditingPrinter({ ...editingPrinter, price: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Taxa Manutenção (%)</label>
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    value={((editingPrinter.maintenancePercent || 0.25) * 100).toFixed(0)}
                    onChange={(e) => setEditingPrinter({ ...editingPrinter, maintenancePercent: Number(e.target.value) / 100 })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Vida Útil (Horas)</label>
                  <input
                    type="number"
                    step="500"
                    min="100"
                    required
                    value={editingPrinter.lifespanHours || 5000}
                    onChange={(e) => setEditingPrinter({ ...editingPrinter, lifespanHours: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Potência (kW)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={editingPrinter.powerKw || 0.125}
                    onChange={(e) => setEditingPrinter({ ...editingPrinter, powerKw: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-[10px] text-slate-400 block mt-0.5">Ex: 0.125 kW = 125W</span>
                </div>
              </div>

              {/* Estimated hourly preview */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-slate-600 text-[11px] font-mono">
                Depreciação Calculada: R${' '}
                {editingPrinter.lifespanHours && editingPrinter.lifespanHours > 0
                  ? (
                      ((editingPrinter.price || 0) + (editingPrinter.price || 0) * (editingPrinter.maintenancePercent || 0.25)) /
                      editingPrinter.lifespanHours
                    ).toFixed(3)
                  : '0.000'}
                /hora
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer shadow-xs transition-colors"
                >
                  Salvar Impressora
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
