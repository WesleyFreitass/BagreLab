import {
  Customer,
  Printer,
  Material,
  WorkshopSettings,
  SavedQuote,
  MakerWorldModelData,
  AuthUser,
} from './types';
import {
  initialCustomers,
  initialPrinters,
  initialMaterials,
  initialWorkshopSettings,
} from './calculator';

const LOCAL_STORAGE_KEYS = {
  CUSTOMERS: '3dcost_customers',
  PRINTERS: '3dcost_printers',
  MATERIALS: '3dcost_materials',
  SETTINGS: '3dcost_settings',
  QUOTES: '3dcost_quotes',
};

// Check if backend API is reachable
let isBackendOnline = false;

export function getIsBackendOnline(): boolean {
  return isBackendOnline;
}

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await fetch('/api/health', { signal: AbortSignal.timeout(1500) });
    if (res.ok) {
      isBackendOnline = true;
      return true;
    }
  } catch {
    isBackendOnline = false;
  }
  return false;
}

// --- IMPRESSORAS ---
export async function fetchPrinters(): Promise<Printer[]> {
  try {
    const res = await fetch('/api/printers', { signal: AbortSignal.timeout(2000) });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const mapped = data.map((item: any) => ({
          ...item,
          id: item._id || item.id,
        }));
        localStorage.setItem(LOCAL_STORAGE_KEYS.PRINTERS, JSON.stringify(mapped));
        return mapped;
      }
    }
  } catch {
    // Fallback to localStorage
  }

  const local = localStorage.getItem(LOCAL_STORAGE_KEYS.PRINTERS);
  if (local) {
    try {
      return JSON.parse(local);
    } catch {
      // fallback
    }
  }

  localStorage.setItem(LOCAL_STORAGE_KEYS.PRINTERS, JSON.stringify(initialPrinters));
  return initialPrinters;
}

export async function savePrinterApi(printer: Partial<Printer>): Promise<Printer> {
  const localList = await fetchPrinters();
  let updatedList: Printer[];
  let savedPrinter: Printer;

  try {
    if (printer.id && !printer.id.startsWith('temp-')) {
      const res = await fetch(`/api/printers/${printer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(printer),
      });
      if (res.ok) {
        const data = await res.json();
        savedPrinter = { ...data, id: data._id || data.id };
        updatedList = localList.map((p) => (p.id === savedPrinter.id ? savedPrinter : p));
        localStorage.setItem(LOCAL_STORAGE_KEYS.PRINTERS, JSON.stringify(updatedList));
        return savedPrinter;
      }
    } else {
      const res = await fetch('/api/printers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(printer),
      });
      if (res.ok) {
        const data = await res.json();
        savedPrinter = { ...data, id: data._id || data.id };
        updatedList = [...localList, savedPrinter];
        localStorage.setItem(LOCAL_STORAGE_KEYS.PRINTERS, JSON.stringify(updatedList));
        return savedPrinter;
      }
    }
  } catch {
    // Fallback to offline local storage
  }

  // Offline fallback
  const maintenanceCost = (printer.price || 0) * (printer.maintenancePercent || 0.25);
  const depreciationPerHour =
    (printer.lifespanHours || 5000) > 0 ? ((printer.price || 0) + maintenanceCost) / (printer.lifespanHours || 5000) : 0;

  savedPrinter = {
    id: printer.id || `local-p-${Date.now()}`,
    name: printer.name || 'Nova Impressora',
    price: Number(printer.price) || 0,
    maintenancePercent: Number(printer.maintenancePercent) || 0.25,
    maintenanceCost,
    lifespanHours: Number(printer.lifespanHours) || 5000,
    powerKw: Number(printer.powerKw) || 0.125,
    depreciationPerHour,
  };

  const existingIndex = localList.findIndex((p) => p.id === savedPrinter.id);
  if (existingIndex >= 0) {
    localList[existingIndex] = savedPrinter;
    updatedList = [...localList];
  } else {
    updatedList = [...localList, savedPrinter];
  }

  localStorage.setItem(LOCAL_STORAGE_KEYS.PRINTERS, JSON.stringify(updatedList));
  return savedPrinter;
}

export async function deletePrinterApi(id: string): Promise<void> {
  try {
    await fetch(`/api/printers/${id}`, { method: 'DELETE' });
  } catch {
    // offline
  }

  const localList = await fetchPrinters();
  const filtered = localList.filter((p) => p.id !== id);
  localStorage.setItem(LOCAL_STORAGE_KEYS.PRINTERS, JSON.stringify(filtered));
}

// --- MATERIAIS ---
export async function fetchMaterials(): Promise<Material[]> {
  try {
    const res = await fetch('/api/materials', { signal: AbortSignal.timeout(2000) });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const mapped = data.map((item: any) => ({
          ...item,
          id: item._id || item.id,
        }));
        localStorage.setItem(LOCAL_STORAGE_KEYS.MATERIALS, JSON.stringify(mapped));
        return mapped;
      }
    }
  } catch {
    // Fallback
  }

  const local = localStorage.getItem(LOCAL_STORAGE_KEYS.MATERIALS);
  if (local) {
    try {
      return JSON.parse(local);
    } catch {
      // fallback
    }
  }

  localStorage.setItem(LOCAL_STORAGE_KEYS.MATERIALS, JSON.stringify(initialMaterials));
  return initialMaterials;
}

export async function saveMaterialApi(material: Partial<Material>): Promise<Material> {
  const localList = await fetchMaterials();
  let updatedList: Material[];
  let savedMat: Material;

  try {
    if (material.id && !material.id.startsWith('temp-') && !material.id.startsWith('local-')) {
      const res = await fetch(`/api/materials/${material.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(material),
      });
      if (res.ok) {
        const data = await res.json();
        savedMat = { ...data, id: data._id || data.id };
        updatedList = localList.map((m) => (m.id === savedMat.id ? savedMat : m));
        localStorage.setItem(LOCAL_STORAGE_KEYS.MATERIALS, JSON.stringify(updatedList));
        return savedMat;
      }
    } else {
      const res = await fetch('/api/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(material),
      });
      if (res.ok) {
        const data = await res.json();
        savedMat = { ...data, id: data._id || data.id };
        updatedList = [...localList, savedMat];
        localStorage.setItem(LOCAL_STORAGE_KEYS.MATERIALS, JSON.stringify(updatedList));
        return savedMat;
      }
    }
  } catch {
    // Fallback
  }

  const costPerKg = (material.weightSpoolKg || 1) > 0 ? (material.costPerSpool || 0) / (material.weightSpoolKg || 1) : 0;
  savedMat = {
    id: material.id || `local-m-${Date.now()}`,
    name: material.name || 'Novo Filamento',
    brand: material.brand || '',
    costPerSpool: Number(material.costPerSpool) || 0,
    weightSpoolKg: Number(material.weightSpoolKg) || 1,
    costPerKg,
    type: material.type || 'PLA',
    color: material.color || '#3b82f6',
  };

  const existingIndex = localList.findIndex((m) => m.id === savedMat.id);
  if (existingIndex >= 0) {
    localList[existingIndex] = savedMat;
    updatedList = [...localList];
  } else {
    updatedList = [...localList, savedMat];
  }

  localStorage.setItem(LOCAL_STORAGE_KEYS.MATERIALS, JSON.stringify(updatedList));
  return savedMat;
}

export async function deleteMaterialApi(id: string): Promise<void> {
  try {
    await fetch(`/api/materials/${id}`, { method: 'DELETE' });
  } catch {
    // offline
  }

  const localList = await fetchMaterials();
  const filtered = localList.filter((m) => m.id !== id);
  localStorage.setItem(LOCAL_STORAGE_KEYS.MATERIALS, JSON.stringify(filtered));
}

// --- CONFIGURAÇÕES ---
export async function fetchSettings(): Promise<WorkshopSettings> {
  try {
    const res = await fetch('/api/settings', { signal: AbortSignal.timeout(2000) });
    if (res.ok) {
      const data = await res.json();
      if (data && data.costPerKwh) {
        localStorage.setItem(LOCAL_STORAGE_KEYS.SETTINGS, JSON.stringify(data));
        return data;
      }
    }
  } catch {
    // Fallback
  }

  const local = localStorage.getItem(LOCAL_STORAGE_KEYS.SETTINGS);
  if (local) {
    try {
      return JSON.parse(local);
    } catch {
      // fallback
    }
  }

  localStorage.setItem(LOCAL_STORAGE_KEYS.SETTINGS, JSON.stringify(initialWorkshopSettings));
  return initialWorkshopSettings;
}

export async function saveSettingsApi(settings: WorkshopSettings): Promise<WorkshopSettings> {
  try {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    if (res.ok) {
      const data = await res.json();
      localStorage.setItem(LOCAL_STORAGE_KEYS.SETTINGS, JSON.stringify(data));
      return data;
    }
  } catch {
    // offline
  }

  localStorage.setItem(LOCAL_STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  return settings;
}

// --- ORÇAMENTOS ---
export async function fetchQuotes(): Promise<SavedQuote[]> {
  try {
    const res = await fetch('/api/quotes', { signal: AbortSignal.timeout(2000) });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        const mapped = data.map((item: any) => ({
          ...item,
          id: item._id || item.id,
        }));
        localStorage.setItem(LOCAL_STORAGE_KEYS.QUOTES, JSON.stringify(mapped));
        return mapped;
      }
    }
  } catch {
    // Fallback
  }

  const local = localStorage.getItem(LOCAL_STORAGE_KEYS.QUOTES);
  if (local) {
    try {
      return JSON.parse(local);
    } catch {
      // fallback
    }
  }

  return [];
}

export async function saveQuoteApi(quote: Partial<SavedQuote>): Promise<SavedQuote> {
  const localList = await fetchQuotes();
  let updatedList: SavedQuote[];
  let saved: SavedQuote;

  try {
    if (quote.id && !quote.id.startsWith('local-')) {
      const res = await fetch(`/api/quotes/${quote.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quote),
      });
      if (res.ok) {
        const data = await res.json();
        saved = { ...data, id: data._id || data.id };
        updatedList = localList.map((q) => (q.id === saved.id ? saved : q));
        localStorage.setItem(LOCAL_STORAGE_KEYS.QUOTES, JSON.stringify(updatedList));
        return saved;
      }
    } else {
      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quote),
      });
      if (res.ok) {
        const data = await res.json();
        saved = { ...data, id: data._id || data.id };
        updatedList = [saved, ...localList];
        localStorage.setItem(LOCAL_STORAGE_KEYS.QUOTES, JSON.stringify(updatedList));
        return saved;
      }
    }
  } catch {
    // offline
  }

  saved = {
    ...quote,
    id: quote.id || `local-q-${Date.now()}`,
    quoteNumber: quote.quoteNumber || `ORC-${Date.now().toString().slice(-4)}`,
    customerName: quote.customerName || 'Cliente',
    date: quote.date || new Date().toISOString().split('T')[0],
    status: quote.status || 'draft',
    items: quote.items || [],
    laborActivities: quote.laborActivities || [],
    consumables: quote.consumables || [],
    profitMarginPercent: quote.profitMarginPercent || 50,
    taxesPercent: quote.taxesPercent || 0,
    cardFeePercent: quote.cardFeePercent || 0,
    onlinePlatformFeePercent: quote.onlinePlatformFeePercent || 0,
    shippingCost: quote.shippingCost || 0,
    calculation: quote.calculation!,
    createdAt: quote.createdAt || new Date().toISOString(),
  };

  const existingIndex = localList.findIndex((q) => q.id === saved.id);
  if (existingIndex >= 0) {
    localList[existingIndex] = saved;
    updatedList = [...localList];
  } else {
    updatedList = [saved, ...localList];
  }

  localStorage.setItem(LOCAL_STORAGE_KEYS.QUOTES, JSON.stringify(updatedList));
  return saved;
}

export async function deleteQuoteApi(id: string): Promise<void> {
  try {
    await fetch(`/api/quotes/${id}`, { method: 'DELETE' });
  } catch {
    // offline
  }

  const localList = await fetchQuotes();
  const filtered = localList.filter((q) => q.id !== id);
  localStorage.setItem(LOCAL_STORAGE_KEYS.QUOTES, JSON.stringify(filtered));
}

export async function updateQuoteStatusApi(id: string, status: SavedQuote['status']): Promise<void> {
  try {
    await fetch(`/api/quotes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
  } catch {
    // offline
  }

  const localList = await fetchQuotes();
  const idx = localList.findIndex((q) => q.id === id || q._id === id);
  if (idx >= 0) {
    localList[idx].status = status;
    localStorage.setItem(LOCAL_STORAGE_KEYS.QUOTES, JSON.stringify(localList));
  }
}

// --- AUTENTICAÇÃO & CONTROLE DE ACESSO (MAKER vs CLIENTE) ---
const AUTH_STORAGE_KEY = '3dcost_auth_user';

export const defaultMakerUser: AuthUser = {
  id: 'maker-1',
  name: 'Wesley Freitas (Maker)',
  email: 'wesley@oficina3d.com',
  phone: '11999998888',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
  role: 'maker',
};

export function getStoredAuthUser(): AuthUser {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return defaultMakerUser;
}

export function saveStoredAuthUser(user: AuthUser): void {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
}

// --- CLIENTES (CADASTRO & HISTÓRICO) ---
export async function fetchCustomers(): Promise<Customer[]> {
  try {
    const res = await fetch('/api/customers', { signal: AbortSignal.timeout(2000) });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const mapped = data.map((item: any) => ({
          ...item,
          id: item._id || item.id,
        }));
        localStorage.setItem(LOCAL_STORAGE_KEYS.CUSTOMERS, JSON.stringify(mapped));
        return mapped;
      }
    }
  } catch {
    // offline fallback
  }

  const stored = localStorage.getItem(LOCAL_STORAGE_KEYS.CUSTOMERS);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // fallback
    }
  }

  localStorage.setItem(LOCAL_STORAGE_KEYS.CUSTOMERS, JSON.stringify(initialCustomers));
  return initialCustomers;
}

export async function saveCustomerApi(customer: Partial<Customer>): Promise<Customer> {
  const localList = await fetchCustomers();
  let saved: Customer;
  let updatedList: Customer[];

  // Evita duplicação caso o cliente já exista pelo telefone ou e-mail
  const cleanPhone = customer.phone ? customer.phone.replace(/\D/g, '') : '';
  const existingIdx = localList.findIndex((c) => {
    if (customer.id && c.id === customer.id) return true;
    const cPhone = c.phone ? c.phone.replace(/\D/g, '') : '';
    const matchPhone = cleanPhone && cPhone && (cleanPhone.slice(-8) === cPhone.slice(-8));
    const matchEmail = customer.email && c.email && customer.email.toLowerCase() === c.email.toLowerCase();
    const matchGoogle = customer.googleId && c.googleId && customer.googleId === c.googleId;
    return matchPhone || matchEmail || matchGoogle;
  });

  const existingCustomer = existingIdx >= 0 ? localList[existingIdx] : null;
  const effectiveId = customer.id || existingCustomer?.id;

  try {
    const isEditing = Boolean(effectiveId && !effectiveId.startsWith('local-'));
    const endpoint = isEditing ? `/api/customers/${effectiveId}` : '/api/customers';
    const method = isEditing ? 'PUT' : 'POST';

    const res = await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...customer, id: effectiveId }),
      signal: AbortSignal.timeout(3000),
    });

    if (res.ok) {
      const data = await res.json();
      saved = { ...data, id: data._id || data.id };
      const idx = localList.findIndex((c) => c.id === saved.id);
      if (idx >= 0) {
        localList[idx] = saved;
        updatedList = [...localList];
      } else {
        updatedList = [saved, ...localList];
      }
      localStorage.setItem(LOCAL_STORAGE_KEYS.CUSTOMERS, JSON.stringify(updatedList));
      return saved;
    }
  } catch {
    // offline fallback
  }

  saved = {
    ...(existingCustomer || {}),
    ...customer,
    id: effectiveId || `local-c-${Date.now()}`,
    name: customer.name || existingCustomer?.name || 'Novo Cliente',
    phone: customer.phone || existingCustomer?.phone || '',
    email: customer.email || existingCustomer?.email || '',
    notes: customer.notes || existingCustomer?.notes || '',
    createdAt: customer.createdAt || existingCustomer?.createdAt || new Date().toISOString(),
  } as Customer;

  const idx = localList.findIndex((c) => c.id === saved.id);
  if (idx >= 0) {
    localList[idx] = saved;
    updatedList = [...localList];
  } else {
    updatedList = [saved, ...localList];
  }

  localStorage.setItem(LOCAL_STORAGE_KEYS.CUSTOMERS, JSON.stringify(updatedList));
  return saved;
}

export async function deleteCustomerApi(id: string): Promise<void> {
  try {
    await fetch(`/api/customers/${id}`, { method: 'DELETE' });
  } catch {
    // offline
  }

  const localList = await fetchCustomers();
  const filtered = localList.filter((c) => c.id !== id);
  localStorage.setItem(LOCAL_STORAGE_KEYS.CUSTOMERS, JSON.stringify(filtered));
}

// --- DISPARO WHATSAPP ---
export async function sendWhatsAppMessageApi(params: {
  phone: string;
  message: string;
  quoteId?: string;
}): Promise<{ success: boolean; mode: 'api' | 'link'; whatsappUrl?: string; message?: string }> {
  try {
    const res = await fetch('/api/whatsapp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
      signal: AbortSignal.timeout(5000),
    });

    if (res.ok) {
      return await res.json();
    }
  } catch {
    // offline fallback
  }

  // Fallback offline: gera link direto
  let cleanPhone = params.phone.replace(/\D/g, '');
  if (cleanPhone.length === 10 || cleanPhone.length === 11) {
    cleanPhone = `55${cleanPhone}`;
  }
  const whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(params.message)}`;

  return {
    success: true,
    mode: 'link',
    whatsappUrl,
  };
}

// --- PARSER MAKERWORLD ---
export async function parseMakerWorldUrl(url: string): Promise<MakerWorldModelData> {
  const res = await fetch('/api/makerworld/parse', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
    signal: AbortSignal.timeout(12000),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Erro ao consultar MakerWorld (${res.status})`);
  }

  return await res.json();
}
