export interface MakerWorldFilament {
  type: string;
  color: string;
  usedG: number;
  usedM?: number;
}

export interface MakerWorldInstance {
  id: number;
  title: string;
  predictionSeconds: number;
  totalHours: number;
  printDays: number;
  printHours: number;
  printMinutes: number;
  weightGrams: number;
  platesCount: number;
  nozzleDiameter: number;
  compatibilityPrinters: string[];
  filaments: MakerWorldFilament[];
  isDefault: boolean;
}

export interface MakerWorldModelData {
  designId: number;
  title: string;
  coverUrl: string;
  creatorName: string;
  creatorAvatar?: string;
  instances: MakerWorldInstance[];
  selectedInstance: MakerWorldInstance;
  sourceUrl: string;
}

export interface Customer {
  id: string;
  _id?: string;
  name: string;
  phone: string; // WhatsApp com DDD
  email?: string;
  document?: string; // CPF ou CNPJ
  city?: string;
  state?: string;
  address?: string;
  notes?: string;
  createdAt?: string;
}

export interface Printer {
  id: string;
  name: string;
  price: number; // Preço de aquisição (R$)
  maintenancePercent: number; // Padrão 25% (0.25)
  maintenanceCost: number; // price * maintenancePercent
  lifespanHours: number; // Vida útil em horas (ex: 5000)
  powerKw: number; // Consumo em kW (ex: 0.125 = 125W)
  depreciationPerHour: number; // (price + maintenanceCost) / lifespanHours
}

export interface Material {
  id: string;
  name: string;
  brand?: string;
  costPerSpool: number; // R$ por rolo
  weightSpoolKg: number; // Peso por rolo em kg (ex: 1)
  costPerKg: number; // costPerSpool / weightSpoolKg
  type: string; // PLA, PETG, ABS, TPU, Resina
  color?: string;
}

export interface FixedExpenseItem {
  id: string;
  name: string;
  cost: number; // Custo mensal em R$
}

export interface AssetDepreciationItem {
  id: string;
  name: string;
  cost: number; // Preço do bem em R$
  lifespanYears: number; // Vida útil em anos
  monthlyDepreciation: number; // cost / (lifespanYears * 12)
}

export interface WorkshopSettings {
  costPerKwh: number; // R$/kWh (ex: 0.90)
  failureRatePercent: number; // % (ex: 15)
  productivePeople: number; // ex: 1
  dailyHoursPerPerson: number; // ex: 8
  daysPerMonth: number; // ex: 22
  productivityPercent: number; // ex: 85 (0.85)
  // Encargos de comercialização padrão
  taxesPercent: number; // Impostos MEI / Simples (ex: 0%)
  onlinePlatformFeePercent: number; // Taxa marketplace ML/Shopee (ex: 0%)
  cardFeePercent: number; // Taxa de cartão / gateway (ex: 0%)
  defaultProfitMarginPercent: number; // Margem padrão (ex: 50%)
  // Integração opcional WhatsApp
  whatsappApiUrl?: string;
  whatsappApiKey?: string;
  whatsappInstance?: string;
  whatsappCustomMessage?: string;
  fixedExpenses: FixedExpenseItem[];
  assets: AssetDepreciationItem[];
}

export interface LaborActivity {
  id: string;
  name: string;
  minutes: number;
}

export interface ConsumableItem {
  id: string;
  name: string;
  cost: number;
}

export interface QuoteItem {
  id: string;
  name: string;
  materialId: string;
  printerId: string;
  weightGrams: number;
  printDays: number;
  printHours: number;
  printMinutes: number;
}

export interface QuoteCalculationResult {
  totalHours: number;
  materialCost: number;
  depreciationCost: number;
  electricityCost: number;
  machineCost: number;
  directProductionSubtotal: number;
  failureCost: number;
  consumablesCost: number;
  laborMinutes: number;
  hourlyLaborRate: number;
  laborCost: number;
  totalProductionCost: number;
  totalCommercialIndicesPercent: number;
  markupMultiplier: number;
  taxesCost: number;
  platformFeesCost: number;
  cardFeesCost: number;
  profitCost: number;
  salePriceCash: number;
  shippingCost: number;
  finalPriceWithShipping: number;
  breakdown: {
    materialPercent: number;
    depreciationPercent: number;
    electricityPercent: number;
    failurePercent: number;
    laborPercent: number;
    taxesPercent: number;
    feesPercent: number;
    profitPercent: number;
  };
}

export interface SavedQuote {
  _id?: string;
  id?: string;
  quoteNumber: string;
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  customerContact?: string;
  date: string;
  status: 'draft' | 'sent' | 'approved' | 'in_production' | 'completed';
  items: QuoteItem[];
  laborActivities: LaborActivity[];
  consumables: ConsumableItem[];
  profitMarginPercent: number;
  taxesPercent: number;
  cardFeePercent: number;
  onlinePlatformFeePercent: number;
  shippingCost: number;
  notes?: string;
  calculation: QuoteCalculationResult;
  createdAt?: string;
}
