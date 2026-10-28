import React, { useState } from 'react';
import { Material } from '../lib/types';
import { formatCurrency } from '../lib/calculator';
import { Plus, Trash2, Edit2, X, Layers } from 'lucide-react';

interface MaterialsTabProps {
  materials: Material[];
  onSaveMaterial: (material: Partial<Material>) => Promise<void>;
  onDeleteMaterial: (id: string) => Promise<void>;
}

export const MaterialsTab: React.FC<MaterialsTabProps> = ({
  materials,
  onSaveMaterial,
  onDeleteMaterial,
}) => {
  const [editingMaterial, setEditingMaterial] = useState<Partial<Material> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenAdd = () => {
    setEditingMaterial({
      name: '',
      brand: '',
      costPerSpool: 120,
      weightSpoolKg: 1,
      type: 'PLA',
      color: '#3b82f6',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (material: Material) => {
    setEditingMaterial(material);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMaterial || !editingMaterial.name) return;
    await onSaveMaterial(editingMaterial);
    setIsModalOpen(false);
    setEditingMaterial(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Top banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600" />
            <span>Gestão de Filamentos & Resinas</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cadastre os insumos e carretéis da sua oficina para calcular o custo exato em gramas na impressão.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs cursor-pointer transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Filamento</span>
        </button>
      </div>

      {/* Materials Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Material / Marca</th>
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4 text-right">Preço por Rolo</th>
                <th className="py-3 px-4 text-right">Peso do Rolo</th>
                <th className="py-3 px-4 text-right">Custo por kg</th>
                <th className="py-3 px-4 text-right">Custo por grama</th>
                <th className="py-3 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {materials.map((mat) => {
                const costPerKg = mat.weightSpoolKg > 0 ? mat.costPerSpool / mat.weightSpoolKg : 0;
                const costPerGram = costPerKg / 1000;
                return (
                  <tr key={mat.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900 flex items-center gap-2.5">
                      <div
                        className="w-4 h-4 rounded-full border border-slate-300 shadow-2xs shrink-0"
                        style={{ backgroundColor: mat.color || '#3b82f6' }}
                      />
                      <div>
                        <span className="block">{mat.name}</span>
                        {mat.brand && <span className="text-[11px] text-slate-400 font-normal">{mat.brand}</span>}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {mat.type || 'PLA'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-medium text-slate-900">
                      {formatCurrency(mat.costPerSpool)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-600">
                      {mat.weightSpoolKg} kg ({mat.weightSpoolKg * 1000}g)
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(costPerKg)} / kg
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-blue-600 font-semibold">
                      {formatCurrency(costPerGram)} / g
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(mat)}
                          className="p-1.5 rounded-md text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Editar"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteMaterial(mat.id)}
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

      {/* Add/Edit Material Modal */}
      {isModalOpen && editingMaterial && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                {editingMaterial.id ? 'Editar Filamento' : 'Cadastrar Novo Filamento'}
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
                <label className="text-slate-700 font-semibold block mb-1">Nome de Identificação</label>
                <input
                  type="text"
                  required
                  value={editingMaterial.name || ''}
                  onChange={(e) => setEditingMaterial({ ...editingMaterial, name: e.target.value })}
                  placeholder="Ex: PLA Preto Premium, PETG Transparente..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Marca / Fabricante</label>
                  <input
                    type="text"
                    value={editingMaterial.brand || ''}
                    onChange={(e) => setEditingMaterial({ ...editingMaterial, brand: e.target.value })}
                    placeholder="Ex: Voolt3D, Benser..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Tipo de Polímero</label>
                  <select
                    value={editingMaterial.type || 'PLA'}
                    onChange={(e) => setEditingMaterial({ ...editingMaterial, type: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="PLA">PLA</option>
                    <option value="PETG">PETG</option>
                    <option value="ABS">ABS</option>
                    <option value="TPU">TPU (Flexível)</option>
                    <option value="ASA">ASA</option>
                    <option value="Resina">Resina UV</option>
                    <option value="Nylon">Nylon / Poliamida</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Custo por Rolo (R$)</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    required
                    value={editingMaterial.costPerSpool || 0}
                    onChange={(e) => setEditingMaterial({ ...editingMaterial, costPerSpool: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold block mb-1">Peso do Rolo (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    value={editingMaterial.weightSpoolKg || 1}
                    onChange={(e) => setEditingMaterial({ ...editingMaterial, weightSpoolKg: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-slate-600 text-[11px] font-mono">
                Custo por kg: R${' '}
                {editingMaterial.weightSpoolKg && editingMaterial.weightSpoolKg > 0
                  ? ((editingMaterial.costPerSpool || 0) / editingMaterial.weightSpoolKg).toFixed(2)
                  : '0.00'}{' '}
                | Custo por grama: R${' '}
                {editingMaterial.weightSpoolKg && editingMaterial.weightSpoolKg > 0
                  ? (((editingMaterial.costPerSpool || 0) / editingMaterial.weightSpoolKg) / 1000).toFixed(4)
                  : '0.0000'}
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
                  Salvar Material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
