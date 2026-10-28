import mongoose from 'mongoose';

const settingSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'global', unique: true },
    costPerKwh: { type: Number, default: 0.90 },
    failureRatePercent: { type: Number, default: 15 },
    productivePeople: { type: Number, default: 1 },
    dailyHoursPerPerson: { type: Number, default: 8 },
    daysPerMonth: { type: Number, default: 22 },
    productivityPercent: { type: Number, default: 85 },
    taxesPercent: { type: Number, default: 0 },
    onlinePlatformFeePercent: { type: Number, default: 0 },
    cardFeePercent: { type: Number, default: 0 },
    defaultProfitMarginPercent: { type: Number, default: 50 },
    fixedExpenses: [
      {
        id: String,
        name: String,
        cost: Number,
      },
    ],
    assets: [
      {
        id: String,
        name: String,
        cost: Number,
        lifespanYears: Number,
        monthlyDepreciation: Number,
      },
    ],
  },
  { timestamps: true }
);

export const SettingModel = mongoose.model('Setting', settingSchema);
