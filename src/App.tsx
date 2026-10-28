import { useState, useEffect } from 'react';
import {
  Customer,
  Printer,
  Material,
  WorkshopSettings,
  SavedQuote,
} from './lib/types';
import {
  fetchCustomers,
  saveCustomerApi,
  deleteCustomerApi,
  fetchPrinters,
  savePrinterApi,
  deletePrinterApi,
  fetchMaterials,
  saveMaterialApi,
  deleteMaterialApi,
  fetchSettings,
  saveSettingsApi,
  fetchQuotes,
  saveQuoteApi,
  deleteQuoteApi,
  checkBackendHealth,
} from './lib/api';
import { initialCustomers, initialPrinters, initialMaterials, initialWorkshopSettings } from './lib/calculator';
import { Navbar, TabType } from './components/Navbar';
import { CalculatorTab } from './components/CalculatorTab';
import { CustomersTab } from './components/CustomersTab';
import { PrintersTab } from './components/PrintersTab';
import { MaterialsTab } from './components/MaterialsTab';
import { SettingsTab } from './components/SettingsTab';
import { QuotesTab } from './components/QuotesTab';

export function App() {
  const [activeTab, setActiveTab] = useState<TabType>('calculator');
  const [isBackendConnected, setIsBackendConnected] = useState(false);

  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [printers, setPrinters] = useState<Printer[]>(initialPrinters);
  const [materials, setMaterials] = useState<Material[]>(initialMaterials);
  const [settings, setSettings] = useState<WorkshopSettings>(initialWorkshopSettings);
  const [quotes, setQuotes] = useState<SavedQuote[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load initial data
  useEffect(() => {
    async function init() {
      try {
        const isOnline = await checkBackendHealth();
        setIsBackendConnected(isOnline);

        const [loadedCustomers, loadedPrinters, loadedMaterials, loadedSettings, loadedQuotes] = await Promise.all([
          fetchCustomers(),
          fetchPrinters(),
          fetchMaterials(),
          fetchSettings(),
          fetchQuotes(),
        ]);

        setCustomers(loadedCustomers);
        setPrinters(loadedPrinters);
        setMaterials(loadedMaterials);
        setSettings(loadedSettings);
        setQuotes(loadedQuotes);
      } catch (err) {
        console.warn('Iniciando com dados locais/cache:', err);
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, []);

  // Customer handlers
  const handleSaveCustomer = async (customer: Partial<Customer>): Promise<Customer> => {
    const saved = await saveCustomerApi(customer);
    const updated = await fetchCustomers();
    setCustomers(updated);
    return saved;
  };

  const handleDeleteCustomer = async (id: string) => {
    await deleteCustomerApi(id);
    const updated = await fetchCustomers();
    setCustomers(updated);
  };

  // Handlers for Printers
  const handleSavePrinter = async (printer: Partial<Printer>) => {
    const saved = await savePrinterApi(printer);
    setPrinters((prev) => {
      const idx = prev.findIndex((p) => p.id === saved.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = saved;
        return copy;
      }
      return [...prev, saved];
    });
  };

  const handleDeletePrinter = async (id: string) => {
    await deletePrinterApi(id);
    setPrinters((prev) => prev.filter((p) => p.id !== id));
  };

  // Handlers for Materials
  const handleSaveMaterial = async (material: Partial<Material>) => {
    const saved = await saveMaterialApi(material);
    setMaterials((prev) => {
      const idx = prev.findIndex((m) => m.id === saved.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = saved;
        return copy;
      }
      return [...prev, saved];
    });
  };

  const handleDeleteMaterial = async (id: string) => {
    await deleteMaterialApi(id);
    setMaterials((prev) => prev.filter((m) => m.id !== id));
  };

  // Handlers for Settings
  const handleSaveSettings = async (newSettings: WorkshopSettings) => {
    const saved = await saveSettingsApi(newSettings);
    setSettings(saved);
  };

  // Handlers for Quotes
  const handleSaveQuote = async (quote: Partial<SavedQuote>) => {
    const saved = await saveQuoteApi(quote);
    setQuotes((prev) => {
      const idx = prev.findIndex((q) => q.id === saved.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = saved;
        return copy;
      }
      return [saved, ...prev];
    });
  };

  const handleDeleteQuote = async (id: string) => {
    await deleteQuoteApi(id);
    setQuotes((prev) => prev.filter((q) => q.id !== id && q._id !== id));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-slate-500 font-medium">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span>Carregando plataforma 3DCost...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isBackendConnected={isBackendConnected}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'calculator' && (
          <CalculatorTab
            printers={printers}
            materials={materials}
            settings={settings}
            customers={customers}
            onSaveQuote={handleSaveQuote}
            onQuickSaveCustomer={handleSaveCustomer}
          />
        )}

        {activeTab === 'customers' && (
          <CustomersTab
            customers={customers}
            quotes={quotes}
            onSaveCustomer={handleSaveCustomer}
            onDeleteCustomer={handleDeleteCustomer}
            onSelectCustomerForQuote={() => {
              setActiveTab('calculator');
            }}
          />
        )}

        {activeTab === 'printers' && (
          <PrintersTab
            printers={printers}
            onSavePrinter={handleSavePrinter}
            onDeletePrinter={handleDeletePrinter}
          />
        )}

        {activeTab === 'materials' && (
          <MaterialsTab
            materials={materials}
            onSaveMaterial={handleSaveMaterial}
            onDeleteMaterial={handleDeleteMaterial}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsTab
            settings={settings}
            onSaveSettings={handleSaveSettings}
          />
        )}

        {activeTab === 'quotes' && (
          <QuotesTab
            quotes={quotes}
            materials={materials}
            printers={printers}
            onDeleteQuote={handleDeleteQuote}
          />
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-400 no-print mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            <strong>3DCost</strong> • Sistema de Engenharia de Custos e Formação de Preço para Impressão 3D
          </span>
          <span className="font-mono text-slate-500">
            Fórmulas SEBRAE & CNC Kitchen • Baseado na Planilha v1.3
          </span>
        </div>
      </footer>
    </div>
  );
}
export default App;
