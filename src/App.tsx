import { useState, useEffect } from 'react';
import {
  Customer,
  Printer,
  Material,
  WorkshopSettings,
  SavedQuote,
  QuoteItem,
  AuthUser,
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
  updateQuoteStatusApi,
  checkBackendHealth,
  getStoredAuthUser,
  saveStoredAuthUser,
  defaultMakerUser,
} from './lib/api';
import { initialCustomers, initialPrinters, initialMaterials, initialWorkshopSettings } from './lib/calculator';
import { Navbar, TabType } from './components/Navbar';
import { CalculatorTab } from './components/CalculatorTab';
import { MakerWorldTab } from './components/MakerWorldTab';
import { ClientRequestsTab } from './components/ClientRequestsTab';
import { MyRequestsTab } from './components/MyRequestsTab';
import { CustomersTab } from './components/CustomersTab';
import { PrintersTab } from './components/PrintersTab';
import { MaterialsTab } from './components/MaterialsTab';
import { SettingsTab } from './components/SettingsTab';
import { QuotesTab } from './components/QuotesTab';
import { GoogleAuthModal } from './components/GoogleAuthModal';

export function App() {
  const [currentUser, setCurrentUser] = useState<AuthUser>(getStoredAuthUser);
  const [activeTab, setActiveTab] = useState<TabType>('calculator');
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [printers, setPrinters] = useState<Printer[]>(initialPrinters);
  const [materials, setMaterials] = useState<Material[]>(initialMaterials);
  const [settings, setSettings] = useState<WorkshopSettings>(initialWorkshopSettings);
  const [quotes, setQuotes] = useState<SavedQuote[]>([]);
  const [importedQuoteData, setImportedQuoteData] = useState<{ items?: QuoteItem[]; notes?: string } | null>(null);
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

  // Update stored user
  const handleUpdateCurrentUser = (user: AuthUser) => {
    setCurrentUser(user);
    saveStoredAuthUser(user);
  };

  // Toggle Role between Maker and Client
  const handleToggleRole = () => {
    const nextRole = currentUser.role === 'maker' ? 'client' : 'maker';
    const updatedUser: AuthUser = {
      ...currentUser,
      role: nextRole,
    };
    handleUpdateCurrentUser(updatedUser);

    if (nextRole === 'client') {
      setActiveTab('makerworld');
    } else {
      setActiveTab('client_requests');
    }
  };

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
  const handleSaveQuote = async (quote: Partial<SavedQuote>): Promise<SavedQuote> => {
    const saved = await saveQuoteApi(quote);
    setQuotes((prev) => {
      const idx = prev.findIndex((q) => q.id === saved.id || (saved._id && q._id === saved._id));
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = saved;
        return copy;
      }
      return [saved, ...prev];
    });
    return saved;
  };

  const handleDeleteQuote = async (id: string) => {
    await deleteQuoteApi(id);
    setQuotes((prev) => prev.filter((q) => q.id !== id && q._id !== id));
  };

  const handleUpdateQuoteStatus = async (id: string, status: SavedQuote['status']) => {
    await updateQuoteStatusApi(id, status);
    setQuotes((prev) =>
      prev.map((q) => (q.id === id || q._id === id ? { ...q, status } : q))
    );
  };

  // Handler for Client Submitting Quote Request from MakerWorld
  const handleSubmitClientQuote = async (
    quoteData: Partial<SavedQuote>,
    decision: 'confirm_quote' | 'direct_print'
  ): Promise<SavedQuote> => {
    // 1. Ensure client is saved in customers collection (without duplicating)
    let linkedCustomerId: string | undefined;
    if (currentUser.name && currentUser.phone) {
      const cleanPhone = currentUser.phone.replace(/\D/g, '');
      const existing = customers.find((c) => {
        const cPhone = c.phone ? c.phone.replace(/\D/g, '') : '';
        const matchPhone = cleanPhone && cPhone && (cleanPhone.slice(-8) === cPhone.slice(-8));
        const matchEmail = currentUser.email && c.email && currentUser.email.toLowerCase() === c.email.toLowerCase();
        return matchPhone || matchEmail;
      });

      const customerRecord = await handleSaveCustomer({
        id: existing?.id,
        name: currentUser.name,
        phone: currentUser.phone,
        email: currentUser.email || existing?.email,
        googleId: currentUser.googleId || existing?.googleId,
        avatarUrl: currentUser.avatarUrl || existing?.avatarUrl,
        notes: existing?.notes || `Cliente cadastrado via login com Google / Pedido MakerWorld`,
      });
      linkedCustomerId = customerRecord.id;
    }

    // 2. Save quote
    const saved = await handleSaveQuote({
      ...quoteData,
      customerId: linkedCustomerId,
      customerName: currentUser.name || quoteData.customerName || 'Cliente',
      customerPhone: currentUser.phone || quoteData.customerPhone || '',
      customerEmail: currentUser.email || quoteData.customerEmail || '',
      clientDecision: decision,
      status: decision === 'direct_print' ? 'approved' : 'pending_review',
    });

    return saved;
  };

  const handleImportFromMakerWorld = (data: { modelTitle: string; items: QuoteItem[]; notes?: string }) => {
    setImportedQuoteData({ items: data.items, notes: data.notes });
    setActiveTab('calculator');
  };

  // Handlers for Auth
  const handleAuthSuccess = async (authUser: AuthUser) => {
    handleUpdateCurrentUser(authUser);
    setIsAuthModalOpen(false);

    // Automatically save or update customer record in database without duplicating
    if (authUser.name && authUser.phone) {
      const cleanPhone = authUser.phone.replace(/\D/g, '');
      const existing = customers.find((c) => {
        const cPhone = c.phone ? c.phone.replace(/\D/g, '') : '';
        const matchPhone = cleanPhone && cPhone && (cleanPhone.slice(-8) === cPhone.slice(-8));
        const matchEmail = authUser.email && c.email && authUser.email.toLowerCase() === c.email.toLowerCase();
        return matchPhone || matchEmail;
      });

      await handleSaveCustomer({
        id: existing?.id,
        name: authUser.name,
        email: authUser.email || existing?.email,
        phone: authUser.phone,
        googleId: authUser.googleId || existing?.googleId,
        avatarUrl: authUser.avatarUrl || existing?.avatarUrl,
        notes: existing?.notes || `Cadastrado automaticamente via autenticação Google`,
      });
    }
  };

  const handleLogout = () => {
    const isMaker = currentUser.role === 'maker';
    if (isMaker) {
      // Maker remains maker default
      handleUpdateCurrentUser(defaultMakerUser);
    } else {
      // Reset client to guest
      const guestClient: AuthUser = {
        id: `client-${Date.now()}`,
        name: '',
        email: '',
        phone: '',
        role: 'client',
      };
      handleUpdateCurrentUser(guestClient);
    }
  };

  // Count pending client requests for Maker inbox badge
  const pendingRequestsCount = quotes.filter(
    (q) => q.status === 'pending_review' || (q.clientDecision && q.status !== 'completed' && q.status !== 'cancelled')
  ).length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-slate-500 font-medium">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span>Carregando plataforma BagreLab...</span>
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
        currentUser={currentUser}
        pendingRequestsCount={pendingRequestsCount}
        onToggleRole={handleToggleRole}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* MAKER INBOX: SOLICITAÇÕES DE CLIENTES */}
        {activeTab === 'client_requests' && (
          <ClientRequestsTab
            quotes={quotes}
            materials={materials}
            printers={printers}
            onUpdateStatus={handleUpdateQuoteStatus}
            onDeleteQuote={handleDeleteQuote}
          />
        )}

        {/* CLIENT PORTAL: MINHAS SOLICITAÇÕES */}
        {activeTab === 'my_requests' && (
          <MyRequestsTab
            quotes={quotes}
            currentUser={currentUser}
            materials={materials}
            printers={printers}
            onOpenMakerWorld={() => setActiveTab('makerworld')}
          />
        )}

        {/* CALCULADORA PRINCIPAL */}
        {activeTab === 'calculator' && (
          <CalculatorTab
            printers={printers}
            materials={materials}
            settings={settings}
            customers={customers}
            importedData={importedQuoteData}
            onSaveQuote={async (quote) => {
              await handleSaveQuote(quote);
            }}
            onQuickSaveCustomer={handleSaveCustomer}
          />
        )}

        {/* ORÇADOR AUTOMÁTICO MAKERWORLD */}
        {activeTab === 'makerworld' && (
          <MakerWorldTab
            printers={printers}
            materials={materials}
            settings={settings}
            currentUser={currentUser}
            onRequireAuth={() => setIsAuthModalOpen(true)}
            onSubmitClientQuote={handleSubmitClientQuote}
            onImportToCalculator={handleImportFromMakerWorld}
          />
        )}

        {/* GESTÃO DE CLIENTES */}
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

        {/* IMPRESSORAS */}
        {activeTab === 'printers' && (
          <PrintersTab
            printers={printers}
            onSavePrinter={handleSavePrinter}
            onDeletePrinter={handleDeletePrinter}
          />
        )}

        {/* FILAMENTOS & MATERIAIS */}
        {activeTab === 'materials' && (
          <MaterialsTab
            materials={materials}
            onSaveMaterial={handleSaveMaterial}
            onDeleteMaterial={handleDeleteMaterial}
          />
        )}

        {/* CONFIGURAÇÕES DA OFICINA */}
        {activeTab === 'settings' && (
          <SettingsTab
            settings={settings}
            onSaveSettings={handleSaveSettings}
          />
        )}

        {/* HISTÓRICO DE ORÇAMENTOS */}
        {activeTab === 'quotes' && (
          <QuotesTab
            quotes={quotes}
            materials={materials}
            printers={printers}
            onDeleteQuote={handleDeleteQuote}
          />
        )}
      </main>

      {/* Google Auth & WhatsApp Modal */}
      <GoogleAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
        title="Identifique-se com sua Conta Google"
        subtitle="Informe seu WhatsApp com DDD para o Maker poder entrar em contato e enviar a proposta oficial."
      />

      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-400 no-print mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            <strong>BagreLab</strong> • Sistema de Engenharia de Custos e Orçamentos para Impressão 3D
          </span>
          <span className="text-slate-400">
            © {new Date().getFullYear()} BagreLab • Orçamentos Profissionais
          </span>
        </div>
      </footer>
    </div>
  );
}
export default App;
