import {
  Customer,
  Printer,
  Material,
  WorkshopSettings,
  LaborActivity,
  ConsumableItem,
  QuoteItem,
  QuoteCalculationResult,
} from './types';

export * from './types';

// Default initial data populated directly from the spreadsheet
export const initialPrinters: Printer[] = [
  {
    id: 'kobra-1',
    name: 'Anycubic Kobra',
    price: 3300,
    maintenancePercent: 0.25,
    maintenanceCost: 825,
    lifespanHours: 5000,
    powerKw: 0.125, // 125W
    depreciationPerHour: 0.825, // (3300 + 825) / 5000 = 0.825
  },
];

export const initialMaterials: Material[] = [
  {
    id: 'mat-pla-volt-vermelho',
    name: 'PLA - Volt - Vermelho',
    brand: 'Volt',
    costPerSpool: 119,
    weightSpoolKg: 1,
    costPerKg: 119,
    type: 'PLA',
    color: '#ef4444',
    colorName: 'Vermelho',
  },
  {
    id: 'mat-pla-volt-verde',
    name: 'PLA - Volt - Verde',
    brand: 'Volt',
    costPerSpool: 119,
    weightSpoolKg: 1,
    costPerKg: 119,
    type: 'PLA',
    color: '#10b981',
    colorName: 'Verde',
  },
  {
    id: 'mat-pla-volt-azul',
    name: 'PLA - Volt - Azul',
    brand: 'Volt',
    costPerSpool: 119,
    weightSpoolKg: 1,
    costPerKg: 119,
    type: 'PLA',
    color: '#3b82f6',
    colorName: 'Azul',
  },
  {
    id: 'mat-pla-volt-branco',
    name: 'PLA - Volt - Branco',
    brand: 'Volt',
    costPerSpool: 119,
    weightSpoolKg: 1,
    costPerKg: 119,
    type: 'PLA',
    color: '#f8fafc',
    colorName: 'Branco',
  },
  {
    id: 'mat-pla-volt-laranja',
    name: 'PLA - Volt - Laranja',
    brand: 'Volt',
    costPerSpool: 119,
    weightSpoolKg: 1,
    costPerKg: 119,
    type: 'PLA',
    color: '#f97316',
    colorName: 'Laranja',
  },
  {
    id: 'mat-pla-volt-rosa',
    name: 'PLA - Volt - Rosa',
    brand: 'Volt',
    costPerSpool: 119,
    weightSpoolKg: 1,
    costPerKg: 119,
    type: 'PLA',
    color: '#ec4899',
    colorName: 'Rosa',
  },
  {
    id: 'mat-pla-volt-roxo',
    name: 'PLA - Volt - Roxo',
    brand: 'Volt',
    costPerSpool: 119,
    weightSpoolKg: 1,
    costPerKg: 119,
    type: 'PLA',
    color: '#8b5cf6',
    colorName: 'Roxo',
  },
  {
    id: 'mat-pla-volt-bege',
    name: 'PLA - Volt - Bege',
    brand: 'Volt',
    costPerSpool: 119,
    weightSpoolKg: 1,
    costPerKg: 119,
    type: 'PLA',
    color: '#d4b996',
    colorName: 'Bege',
  },
  {
    id: 'mat-pla-volt-dourado',
    name: 'PLA - Volt - Dourado',
    brand: 'Volt',
    costPerSpool: 119,
    weightSpoolKg: 1,
    costPerKg: 119,
    type: 'PLA',
    color: '#eab308',
    colorName: 'Dourado',
  },
  {
    id: 'mat-pla-volt-preto',
    name: 'PLA - Volt - Preto',
    brand: 'Volt',
    costPerSpool: 119,
    weightSpoolKg: 1,
    costPerKg: 119,
    type: 'PLA',
    color: '#0f172a',
    colorName: 'Preto',
  },
  {
    id: 'mat-petg-volt-cinza',
    name: 'Petg - Volt - Cinza',
    brand: 'Volt',
    costPerSpool: 119,
    weightSpoolKg: 1,
    costPerKg: 119,
    type: 'PETG',
    color: '#64748b',
    colorName: 'Cinza',
  },
  {
    id: 'mat-abs-volt-preto',
    name: 'ABS - Volt - Preto',
    brand: 'Volt',
    costPerSpool: 70,
    weightSpoolKg: 1,
    costPerKg: 70,
    type: 'ABS',
    color: '#020617',
    colorName: 'Preto',
  },
];

// Helper to convert hex colors or return human-readable color names
export function formatColorLabel(color?: string, colorName?: string): string {
  if (colorName && colorName.trim()) return colorName.trim();
  if (!color) return '';
  const trimmed = color.trim();
  const hexMap: Record<string, string> = {
    '#3b82f6': 'Azul',
    '#10b981': 'Verde',
    '#f59e0b': 'Laranja',
    '#8b5cf6': 'Roxo',
    '#000000': 'Preto',
    '#0f172a': 'Preto',
    '#020617': 'Preto',
    '#ffffff': 'Branco',
    '#f8fafc': 'Branco',
    '#ef4444': 'Vermelho',
    '#64748b': 'Cinza',
    '#eab308': 'Dourado / Amarelo',
    '#ec4899': 'Rosa',
    '#d4b996': 'Bege',
    '#06b6d4': 'Ciano',
    '#14b8a6': 'Turquesa',
    '#f97316': 'Laranja',
    '#84cc16': 'Verde Lima',
    '#a855f7': 'Roxo',
    '#6b7280': 'Cinza',
    '#d97706': 'Âmbar',
    '#001489': 'Azul Escuro',
  };

  const lower = trimmed.toLowerCase();
  if (hexMap[lower]) return hexMap[lower];
  if (lower.startsWith('#')) return 'Personalizado';
  return trimmed;
}

export const initialWorkshopSettings: WorkshopSettings = {
  costPerKwh: 0.90, // R$ 0,90 por kWh
  failureRatePercent: 15, // 15% de margem de risco contra descolamento / falha
  productivePeople: 1,
  dailyHoursPerPerson: 8,
  daysPerMonth: 22,
  productivityPercent: 85, // 85% de eficiência
  taxesPercent: 0, // 0% (MEI isento de imposto por nota)
  onlinePlatformFeePercent: 0,
  cardFeePercent: 0,
  defaultProfitMarginPercent: 50, // 50% de lucro líquido
  fixedExpenses: [
    { id: 'exp-1', name: 'Energia Elétrica Geral (Ambiente)', cost: 0 },
    { id: 'exp-2', name: 'Internet Banda Larga', cost: 0 },
    { id: 'exp-3', name: 'Software CAD / Slicer', cost: 0 },
    { id: 'exp-4', name: 'Contabilidade / MEI (DAS)', cost: 0 },
  ],
  assets: [
    { id: 'ast-1', name: 'Computador / Notebook', cost: 8000, lifespanYears: 5, monthlyDepreciation: 133.33 },
    { id: 'ast-2', name: 'Monitor Auxiliar', cost: 2000, lifespanYears: 5, monthlyDepreciation: 33.33 },
    { id: 'ast-3', name: 'Mesa de Trabalho', cost: 687, lifespanYears: 5, monthlyDepreciation: 11.45 },
    { id: 'ast-4', name: 'Bancada de Pós-Processamento', cost: 687, lifespanYears: 5, monthlyDepreciation: 11.45 },
    { id: 'ast-5', name: 'Alicate e Ferramentas', cost: 20, lifespanYears: 1, monthlyDepreciation: 1.67 },
  ],
};

export const defaultLaborActivities: LaborActivity[] = [
  { id: 'act-download', name: 'Download / Análise do Modelo 3D', minutes: 2 },
  { id: 'act-prep', name: 'Preparação do Modelo (CAD / Ajustes)', minutes: 0 },
  { id: 'act-slice', name: 'Fatiamento (Suportes & Parâmetros)', minutes: 2 },
  { id: 'act-change', name: 'Troca de Filamento / Calibração', minutes: 5 },
  { id: 'act-start', name: 'Transferência e Início de Impressão', minutes: 7 },
  { id: 'act-remove', name: 'Remoção da Peça da Mesa', minutes: 1 },
  { id: 'act-supports', name: 'Remoção de Suportes', minutes: 0 },
  { id: 'act-finish', name: 'Acabamento (Lixamento / Pós-cura)', minutes: 0 },
];

export const defaultConsumables: ConsumableItem[] = [
  { id: 'c-lixa', name: 'Lixa / Acabamento', cost: 0 },
  { id: 'c-tinta', name: 'Primer / Tinta', cost: 0 },
  { id: 'c-embalagem', name: 'Caixa / Plástico Bolha', cost: 0 },
];

/**
 * Calcula o custo por hora de trabalho da oficina
 * Baseado no Total de Despesas Fixas / Total de Horas Produtivas Disponíveis
 */
export function calculateHourlyLaborRate(settings: WorkshopSettings): {
  monthlyFixedExpenses: number;
  monthlyProductiveHours: number;
  hourlyRate: number;
} {
  // Soma das despesas fixas mensais
  const directExpenses = settings.fixedExpenses.reduce((sum, item) => sum + (Number(item.cost) || 0), 0);
  
  // Soma da depreciação mensal do imobilizado (Computador, bancada, etc.)
  const assetsDepreciation = settings.assets.reduce((sum, item) => {
    const cost = Number(item.cost) || 0;
    const years = Number(item.lifespanYears) || 1;
    return sum + (years > 0 ? cost / (years * 12) : 0);
  }, 0);

  const monthlyFixedExpenses = directExpenses + assetsDepreciation;

  // Capacidade produtiva: Pessoas * Horas/dia * Dias/mês * % Produtividade
  const maxHours = (settings.productivePeople || 1) * (settings.dailyHoursPerPerson || 8) * (settings.daysPerMonth || 22);
  const monthlyProductiveHours = maxHours * ((settings.productivityPercent || 85) / 100);

  const hourlyRate = monthlyProductiveHours > 0 ? monthlyFixedExpenses / monthlyProductiveHours : 0;

  return {
    monthlyFixedExpenses,
    monthlyProductiveHours,
    hourlyRate,
  };
}

/**
 * Motor Matemático Principal: Calcula o orçamento completo exatamente conforme as fórmulas da planilha
 */
export function calculateQuote(
  items: QuoteItem[],
  materials: Material[],
  printers: Printer[],
  settings: WorkshopSettings,
  laborActivities: LaborActivity[],
  consumables: ConsumableItem[],
  profitMarginPercent: number,
  taxesPercent: number = 0,
  cardFeePercent: number = 0,
  onlinePlatformFeePercent: number = 0,
  shippingCost: number = 0
): QuoteCalculationResult {
  // 1. Custo da Hora de Trabalho
  const { hourlyRate } = calculateHourlyLaborRate(settings);

  // 2. Acumuladores de peças/mesas
  let totalHours = 0;
  let materialCost = 0;
  let depreciationCost = 0;
  let electricityCost = 0;

  for (const item of items) {
    const itemHours = (Number(item.printDays) || 0) * 24 + (Number(item.printHours) || 0) + (Number(item.printMinutes) || 0) / 60;
    totalHours += itemHours;

    // Localizar material
    const mat = materials.find((m) => m.id === item.materialId);
    const costPerKg = mat ? mat.costPerKg : 0;
    const itemMaterialCost = ((Number(item.weightGrams) || 0) / 1000) * costPerKg;
    materialCost += itemMaterialCost;

    // Localizar impressora
    const printer = printers.find((p) => p.id === item.printerId);
    const depPerHour = printer ? printer.depreciationPerHour : 0;
    const powerKw = printer ? printer.powerKw : 0;

    depreciationCost += itemHours * depPerHour;
    electricityCost += itemHours * powerKw * (settings.costPerKwh || 0.90);
  }

  const machineCost = depreciationCost + electricityCost;
  const directProductionSubtotal = materialCost + machineCost;

  // 3. Taxa de Risco de Falhas (Fórmula exata da planilha: Subtotal / (1 - taxa/100) - Subtotal)
  const failureRateDec = (settings.failureRatePercent || 0) / 100;
  const totalWithFailure = failureRateDec < 1 ? directProductionSubtotal / (1 - failureRateDec) : directProductionSubtotal;
  const failureCost = Math.max(0, totalWithFailure - directProductionSubtotal);

  // 4. Consumíveis extras
  const consumablesCost = consumables.reduce((sum, c) => sum + (Number(c.cost) || 0), 0);

  // 5. Custo da Mão de Obra
  const laborMinutes = laborActivities.reduce((sum, a) => sum + (Number(a.minutes) || 0), 0);
  const laborHours = laborMinutes / 60;
  const laborCost = laborHours * hourlyRate;

  // 6. Custo Total de Produção
  const totalProductionCost = materialCost + depreciationCost + electricityCost + failureCost + consumablesCost + laborCost;

  // 7. Mark-up Divisor Comercial
  // Índices: Impostos + Taxa Marketplace + Taxa Cartão + Margem de Lucro
  const taxesDec = (taxesPercent || 0) / 100;
  const platformDec = (onlinePlatformFeePercent || 0) / 100;
  const cardDec = (cardFeePercent || 0) / 100;
  const profitDec = (profitMarginPercent || 0) / 100;

  const totalCommercialIndicesPercent = taxesDec + platformDec + cardDec + profitDec;

  // Mark-up Multiplicador = 1 / (1 - Total_Indices)
  const markupMultiplier = totalCommercialIndicesPercent < 1 ? 1 / (1 - totalCommercialIndicesPercent) : 1;

  // Preço de Venda à Vista
  const salePriceCash = totalProductionCost * markupMultiplier;

  // Encargos calculados sobre o preço final
  const taxesCost = salePriceCash * taxesDec;
  const platformFeesCost = salePriceCash * platformDec;
  const cardFeesCost = salePriceCash * cardDec;
  const profitCost = salePriceCash * profitDec;

  // Preço final com frete
  const finalPriceWithShipping = salePriceCash + (Number(shippingCost) || 0);

  // 8. Breakdown Percentual (DRE)
  const denominator = salePriceCash > 0 ? salePriceCash : 1;
  const breakdown = {
    materialPercent: (materialCost / denominator) * 100,
    depreciationPercent: (depreciationCost / denominator) * 100,
    electricityPercent: (electricityCost / denominator) * 100,
    failurePercent: (failureCost / denominator) * 100,
    laborPercent: (laborCost / denominator) * 100,
    taxesPercent: (taxesCost / denominator) * 100,
    feesPercent: ((platformFeesCost + cardFeesCost) / denominator) * 100,
    profitPercent: (profitCost / denominator) * 100,
  };

  return {
    totalHours,
    materialCost,
    depreciationCost,
    electricityCost,
    machineCost,
    directProductionSubtotal,
    failureCost,
    consumablesCost,
    laborMinutes,
    hourlyLaborRate: hourlyRate,
    laborCost,
    totalProductionCost,
    totalCommercialIndicesPercent: totalCommercialIndicesPercent * 100,
    markupMultiplier,
    taxesCost,
    platformFeesCost,
    cardFeesCost,
    profitCost,
    salePriceCash,
    shippingCost: Number(shippingCost) || 0,
    finalPriceWithShipping,
    breakdown,
  };
}

export const initialCustomers: Customer[] = [
  {
    id: 'cust-1',
    name: 'Wesley Freitas',
    phone: '11999998888',
    email: 'wesley@exemplo.com',
    city: 'São Paulo',
    state: 'SP',
    notes: 'Cliente Frequente - Peças Técnicas',
  },
  {
    id: 'cust-2',
    name: 'Oficina Maker 3D',
    phone: '11988887777',
    email: 'contato@oficinamaker.com',
    city: 'Campinas',
    state: 'SP',
    notes: 'Prototipagem rápida',
  },
];

/**
 * Normaliza número de telefone para o padrão WhatsApp internacional (DDI 55)
 */
export function cleanWhatsAppPhone(phone: string): string {
  let cleaned = (phone || '').replace(/\D/g, '');
  if (cleaned.length === 10 || cleaned.length === 11) {
    cleaned = `55${cleaned}`;
  }
  return cleaned;
}

/**
 * Gera URL direta para o WhatsApp Web / App
 */
export function generateWhatsAppLink(phone: string, message: string): string {
  const cleanPhone = cleanWhatsAppPhone(phone);
  return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
}

/**
 * Gera mensagem formatada da proposta comercial para envio no WhatsApp
 */
export function formatWhatsAppProposalMessage(params: {
  quoteNumber: string;
  customerName: string;
  date?: string;
  items: QuoteItem[];
  materials?: Material[];
  finalPrice: number;
  shippingCost?: number;
  notes?: string;
}): string {
  const { quoteNumber, customerName, date, items, materials = [], finalPrice, shippingCost = 0, notes } = params;
  
  const itemsList = items
    .map((item, idx) => {
      const mat = materials.find((m) => m.id === item.materialId);
      const totalTimeHours = item.printDays * 24 + item.printHours + item.printMinutes / 60;
      return `  ▫️ *${item.name || `Item ${idx + 1}`}* (${item.weightGrams}g, ${mat?.name || 'Filamento'}, ~${formatHours(totalTimeHours)})`;
    })
    .join('\n');

  const notesText = notes ? `\n📌 *Observações:* ${notes}\n` : '';
  const shippingText = shippingCost > 0 ? `📦 *Frete / Envio:* ${formatCurrency(shippingCost)}\n` : '';

  return `📐 *ORÇAMENTO DE IMPRESSÃO 3D #${quoteNumber}*
🗓️ *Data:* ${date || new Date().toLocaleDateString('pt-BR')}
👤 *Cliente:* ${customerName || 'Cliente'}

📋 *Peças Inclusas:*
${itemsList}
${notesText}${shippingText}
💰 *Valor Total do Pedido:* ${formatCurrency(finalPrice)}
✅ *Prazo de Validade:* 15 dias corridos
💳 *Formas de Pagamento:* PIX, Cartão ou Transferência

Para aprovar o início da produção ou tirar dúvidas, basta responder esta mensagem!`;
}

/**
 * Gera mensagem formatada no WhatsApp para orçamento REVISADO pelo Maker
 * Informa com clareza o valor original estimado, o novo valor real pós-fatiamento e a justificativa
 */
export function formatWhatsAppRevisedQuoteMessage(params: {
  quoteNumber: string;
  customerName: string;
  modelTitle?: string;
  originalPrice: number;
  revisedPrice: number;
  revisionNotes?: string;
  items: QuoteItem[];
  materials?: Material[];
  shippingCost?: number;
}): string {
  const {
    quoteNumber,
    customerName,
    modelTitle,
    originalPrice,
    revisedPrice,
    revisionNotes,
    items,
    materials = [],
    shippingCost = 0,
  } = params;

  const diff = revisedPrice - originalPrice;
  let diffText = '';
  if (Math.abs(diff) < 0.05) {
    diffText = '*(Valor mantido sem alteração)*';
  } else if (diff > 0) {
    diffText = `*(Ajuste de +${formatCurrency(diff)})*`;
  } else {
    diffText = `*(Desconto de ${formatCurrency(Math.abs(diff))})*`;
  }

  const itemsList = items
    .map((item, idx) => {
      const mat = materials.find((m) => m.id === item.materialId);
      const totalTimeHours = item.printDays * 24 + item.printHours + item.printMinutes / 60;
      return `  ▫️ *${item.name || `Peça ${idx + 1}`}* (${item.weightGrams}g, ${mat?.name || 'Filamento'}, ~${formatHours(totalTimeHours)})`;
    })
    .join('\n');

  const notesBlock = revisionNotes
    ? `\n📝 *Observação Técnica do Maker:*\n"${revisionNotes.trim()}"\n`
    : '';

  const shippingText = shippingCost > 0 ? `📦 *Frete / Entrega:* ${formatCurrency(shippingCost)}\n` : '';

  return `Olá, *${customerName || 'Cliente'}*! Tudo bem? Aqui é o Wesley da *BagreLab*! 🐟

Fiz a análise técnica e o fatiamento detalhado do seu pedido para o modelo:
📦 *Peça:* ${modelTitle || 'Impressão 3D'}
🔖 *Orçamento:* #${quoteNumber}

📊 *Atualização de Valores (Orçamento Real):*
• Valor Estimado Anterior: ~${formatCurrency(originalPrice)}~
• *Novo Valor Real Confirmado:* *${formatCurrency(revisedPrice)}* ${diffText}
${notesBlock}
📋 *Parâmetros Reais de Produção:*
${itemsList}
${shippingText}
Você também pode conferir e acompanhar seu pedido no nosso portal:
🌐 https://bagrelab.pampo.tech

Podemos confirmar o pedido com esse novo valor e iniciar a impressão? 🚀`;
}

/**
 * Formata moeda BRL (R$ 1.234,56)
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0);
}

/**
 * Formata horas decimais em string legível (ex: 4.33h -> 4h 20m)
 */
export function formatHours(hoursDecimal: number): string {
  const totalMinutes = Math.round(hoursDecimal * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}
