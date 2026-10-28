import React, { useState } from 'react';
import { WorkshopSettings, FixedExpenseItem, AssetDepreciationItem } from '../lib/types';
import { calculateHourlyLaborRate, formatCurrency } from '../lib/calculator';
import { Settings, Plus, Trash2, Save, Check, Clock, Zap, Laptop, Building2 } from 'lucide-react';

interface SettingsTabProps {
  settings: WorkshopSettings;
  onSaveSettings: (settings: WorkshopSettings) => Promise<void>;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  settings: initialSettings,
  onSaveSettings,
}) => {
  const [settings, setSettings] = useState<WorkshopSettings>(initialSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Recalculate labor rate live
  const laborCalc = calculateHourlyLaborRate(settings);

  // Handle updates
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await onSaveSettings(settings);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  // Fixed expenses
  const handleAddExpense = () => {
    const newItem: FixedExpenseItem = {
      id: `exp-${Date.now()}`,
      name: 'Nova Despesa Mensal',
      cost: 50,
    };
    setSettings({ ...settings, fixedExpenses: [...settings.fixedExpenses, newItem] });
  };

  const handleUpdateExpense = (id: string, updates: Partial<FixedExpenseItem>) => {
    setSettings({
      ...settings,
      fixedExpenses: settings.fixedExpenses.map((exp) => (exp.id === id ? { ...exp, ...updates } : exp)),
    });
  };

  const handleDeleteExpense = (id: string) => {
    setSettings({
      ...settings,
      fixedExpenses: settings.fixedExpenses.filter((exp) => exp.id !== id),
    });
  };

  // Asset depreciation
  const handleAddAsset = () => {
    const newAsset: AssetDepreciationItem = {
      id: `ast-${Date.now()}`,
      name: 'Novo Equipamento / Ferramenta',
      cost: 1000,
      lifespanYears: 5,
      monthlyDepreciation: 16.67,
    };
    setSettings({ ...settings, assets: [...settings.assets, newAsset] });
  };

  const handleUpdateAsset = (id: string, updates: Partial<AssetDepreciationItem>) => {
    setSettings({
      ...settings,
      assets: settings.assets.map((ast) => {
        if (ast.id === id) {
          const updated = { ...ast, ...updates };
          const cost = Number(updated.cost) || 0;
          const years = Number(updated.lifespanYears) || 1;
          updated.monthlyDepreciation = years > 0 ? cost / (years * 12) : 0;
          return updated;
        }
        return ast;
      }),
    });
  };

  const handleDeleteAsset = (id: string) => {
    setSettings({
      ...settings,
      assets: settings.assets.filter((ast) => ast.id !== id),
    });
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      
      {/* Top banner with live calculated hourly cost */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            <span>Configurações da Oficina & Custo da Hora de Trabalho</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            O valor da sua mão de obra é calculado com base nas suas despesas mensais, depreciação de computadores/ferramentas e jornada produtiva.
          </p>
        </div>

        <div className="bg-slate-50 border border-blue-200 p-4 rounded-xl flex items-center gap-6 shadow-2xs">
          <div>
            <span className="text-[11px] text-slate-500 font-medium block">Despesas Mensais Totais:</span>
            <span className="text-lg font-bold text-slate-900 font-mono">
              {formatCurrency(laborCalc.monthlyFixedExpenses)}
            </span>
            <span className="text-[10px] text-slate-400 block font-mono">{laborCalc.monthlyProductiveHours.toFixed(1)}h produtivas/mês</span>
          </div>

          <div className="pl-6 border-l border-slate-200">
            <span className="text-[11px] text-blue-700 font-bold block uppercase tracking-wider">Custo da Sua Hora:</span>
            <span className="text-2xl font-extrabold text-blue-600 font-mono">
              {formatCurrency(laborCalc.hourlyRate)} <span className="text-xs font-normal text-slate-500">/ hora</span>
            </span>
            <span className="text-[11px] text-slate-500 block font-mono">
              ~ {formatCurrency(laborCalc.hourlyRate / 60)} / minuto
            </span>
          </div>
        </div>
      </div>

      {/* General Grid (Parameters & Productive Capacity) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        
        {/* Energy & Failure Rates */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4 text-xs">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 font-bold text-slate-900">
            <Zap className="w-4 h-4 text-amber-500" />
            <span>Tarifas & Margem de Contingência</span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-slate-700 font-medium block mb-1">
                Custo da Energia Elétrica (R$ / kWh)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0.1"
                  value={settings.costPerKwh}
                  onChange={(e) => setSettings({ ...settings, costPerKwh: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-mono text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-medium">R$/kWh</span>
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">Consulte sua fatura de luz (geralmente entre R$ 0,80 e R$ 1,10).</span>
            </div>

            <div>
              <label className="text-slate-700 font-medium block mb-1">
                Taxa de Risco de Falhas de Impressão (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="1"
                  min="0"
                  max="50"
                  value={settings.failureRatePercent}
                  onChange={(e) => setSettings({ ...settings, failureRatePercent: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-mono text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-medium">%</span>
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Margem padrão da planilha (15%) para cobrir peças que descolam ou falhas de energia.
              </span>
            </div>

            <div>
              <label className="text-slate-700 font-medium block mb-1">
                Margem de Lucro Padrão (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="5"
                  min="10"
                  max="90"
                  value={settings.defaultProfitMarginPercent}
                  onChange={(e) => setSettings({ ...settings, defaultProfitMarginPercent: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-mono text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-medium">%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Productive Capacity Settings */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4 text-xs">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 font-bold text-slate-900">
            <Clock className="w-4 h-4 text-blue-600" />
            <span>Capacidade Produtiva da Mão de Obra</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-700 font-medium block mb-1">Pessoas Produtivas</label>
              <input
                type="number"
                min="1"
                value={settings.productivePeople}
                onChange={(e) => setSettings({ ...settings, productivePeople: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono text-slate-900 font-semibold"
              />
            </div>

            <div>
              <label className="text-slate-700 font-medium block mb-1">Horas Diárias / Pessoa</label>
              <input
                type="number"
                min="1"
                max="24"
                value={settings.dailyHoursPerPerson}
                onChange={(e) => setSettings({ ...settings, dailyHoursPerPerson: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono text-slate-900 font-semibold"
              />
            </div>

            <div>
              <label className="text-slate-700 font-medium block mb-1">Dias Trabalhados / Mês</label>
              <input
                type="number"
                min="1"
                max="31"
                value={settings.daysPerMonth}
                onChange={(e) => setSettings({ ...settings, daysPerMonth: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono text-slate-900 font-semibold"
              />
            </div>

            <div>
              <label className="text-slate-700 font-medium block mb-1">% de Produtividade</label>
              <input
                type="number"
                min="10"
                max="100"
                value={settings.productivityPercent}
                onChange={(e) => setSettings({ ...settings, productivityPercent: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-mono text-slate-900 font-semibold"
              />
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-slate-600 text-[11px] font-mono">
            Horas Produtivas no Mês = {settings.productivePeople} pessoa x {settings.dailyHoursPerPerson}h x {settings.daysPerMonth} dias x {settings.productivityPercent}% ={' '}
            <strong className="text-slate-900">{laborCalc.monthlyProductiveHours.toFixed(1)} horas/mês</strong>
          </div>
        </div>

      </div>

      {/* Assets & Tools Depreciation */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Laptop className="w-4 h-4 text-blue-600" />
            <div>
              <h3 className="text-xs font-bold text-slate-900">Imobilizado & Ferramentas da Oficina (Depreciação)</h3>
              <p className="text-[11px] text-slate-500">Computador, monitores, bancadas e alicates</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddAsset}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Adicionar Equipamento</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Equipamento / Bem</th>
                <th className="py-2.5 px-3 text-right">Valor de Compra (R$)</th>
                <th className="py-2.5 px-3 text-right">Vida Útil (Anos)</th>
                <th className="py-2.5 px-3 text-right">Depreciação Mensal</th>
                <th className="py-2.5 px-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {settings.assets.map((asset) => (
                <tr key={asset.id} className="hover:bg-slate-50/50">
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      value={asset.name}
                      onChange={(e) => handleUpdateAsset(asset.id, { name: e.target.value })}
                      className="w-full bg-transparent border-0 border-b border-transparent hover:border-slate-300 focus:border-blue-500 text-xs text-slate-900 font-medium focus:outline-none"
                    />
                  </td>
                  <td className="py-2 px-3 text-right">
                    <input
                      type="number"
                      step="50"
                      min="0"
                      value={asset.cost}
                      onChange={(e) => handleUpdateAsset(asset.id, { cost: Number(e.target.value) })}
                      className="w-24 bg-transparent border-0 border-b border-transparent hover:border-slate-300 focus:border-blue-500 text-xs text-slate-900 font-mono text-right focus:outline-none"
                    />
                  </td>
                  <td className="py-2 px-3 text-right">
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={asset.lifespanYears}
                      onChange={(e) => handleUpdateAsset(asset.id, { lifespanYears: Number(e.target.value) })}
                      className="w-16 bg-transparent border-0 border-b border-transparent hover:border-slate-300 focus:border-blue-500 text-xs text-slate-900 font-mono text-right focus:outline-none"
                    />
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-semibold text-slate-900">
                    {formatCurrency(asset.cost / (asset.lifespanYears * 12))}
                  </td>
                  <td className="py-2 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => handleDeleteAsset(asset.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Fixed Monthly Expenses */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            <div>
              <h3 className="text-xs font-bold text-slate-900">Despesas Fixas Mensais da Oficina</h3>
              <p className="text-[11px] text-slate-500">Aluguel, internet, contabilidade/DAS e assinaturas</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddExpense}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Adicionar Despesa</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {settings.fixedExpenses.map((exp) => (
            <div key={exp.id} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
              <input
                type="text"
                value={exp.name}
                onChange={(e) => handleUpdateExpense(exp.id, { name: e.target.value })}
                className="bg-transparent border-0 border-b border-transparent hover:border-slate-300 focus:border-blue-500 text-slate-900 font-medium focus:outline-none flex-1 pr-2"
              />
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-slate-400">R$</span>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={exp.cost}
                  onChange={(e) => handleUpdateExpense(exp.id, { cost: Number(e.target.value) })}
                  className="w-20 bg-white border border-slate-300 rounded px-2 py-1 text-right font-mono font-semibold text-slate-900"
                />
                <button
                  type="button"
                  onClick={() => handleDeleteExpense(exp.id)}
                  className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Save Floating Button */}
      <div className="flex justify-end pt-3">
        <button
          type="submit"
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm cursor-pointer transition-colors"
        >
          {savedSuccess ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
          <span>{savedSuccess ? 'Configurações Salvas!' : isSaving ? 'Salvando...' : 'Salvar Alterações da Oficina'}</span>
        </button>
      </div>

    </form>
  );
};
