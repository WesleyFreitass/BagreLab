import mongoose from 'mongoose';

const quoteSchema = new mongoose.Schema(
  {
    quoteNumber: { type: String, required: true },
    customerId: { type: String, default: null },
    customerName: { type: String, required: true, default: 'Cliente' },
    customerPhone: { type: String, default: '' },
    customerEmail: { type: String, default: '' },
    customerContact: { type: String, default: '' },
    date: { type: String, default: () => new Date().toISOString().split('T')[0] },
    status: {
      type: String,
      enum: ['draft', 'sent', 'pending_review', 'revised', 'approved', 'in_production', 'completed', 'cancelled'],
      default: 'draft',
    },
    clientDecision: {
      type: String,
      enum: ['confirm_quote', 'direct_print', null],
      default: null,
    },
    // Revisão técnica do Maker (Valores Reais pós-fatiamento)
    isRevised: { type: Boolean, default: false },
    originalPrice: { type: Number, default: null },
    revisedPrice: { type: Number, default: null },
    revisionNotes: { type: String, default: '' },
    revisedAt: { type: Date, default: null },
    makerWorldData: {
      designId: Number,
      modelTitle: String,
      profileTitle: String,
      sourceUrl: String,
      coverUrl: String,
      filaments: [
        {
          slotIndex: Number,
          originalType: String,
          originalColor: String,
          usedG: Number,
          usedM: Number,
          selectedMaterialId: String,
          customColorName: String,
          customColorHex: String,
        },
      ],
    },
    items: [
      {
        id: String,
        name: String,
        materialId: String,
        printerId: String,
        weightGrams: Number,
        printDays: Number,
        printHours: Number,
        printMinutes: Number,
      },
    ],
    laborActivities: [
      {
        id: String,
        name: String,
        minutes: Number,
      },
    ],
    consumables: [
      {
        id: String,
        name: String,
        cost: Number,
      },
    ],
    profitMarginPercent: { type: Number, default: 50 },
    taxesPercent: { type: Number, default: 0 },
    cardFeePercent: { type: Number, default: 0 },
    onlinePlatformFeePercent: { type: Number, default: 0 },
    shippingCost: { type: Number, default: 0 },
    notes: { type: String, default: '' },
    // Frozen snapshot of calculated financials
    calculation: {
      totalHours: Number,
      materialCost: Number,
      depreciationCost: Number,
      electricityCost: Number,
      machineCost: Number,
      directProductionSubtotal: Number,
      failureCost: Number,
      consumablesCost: Number,
      laborMinutes: Number,
      hourlyLaborRate: Number,
      laborCost: Number,
      totalProductionCost: Number,
      totalCommercialIndicesPercent: Number,
      markupMultiplier: Number,
      taxesCost: Number,
      platformFeesCost: Number,
      cardFeesCost: Number,
      profitCost: Number,
      salePriceCash: Number,
      shippingCost: Number,
      finalPriceWithShipping: Number,
      breakdown: {
        materialPercent: Number,
        depreciationPercent: Number,
        electricityPercent: Number,
        failurePercent: Number,
        laborPercent: Number,
        taxesPercent: Number,
        feesPercent: Number,
        profitPercent: Number,
      },
    },
  },
  { timestamps: true }
);

export const QuoteModel = mongoose.model('Quote', quoteSchema);
