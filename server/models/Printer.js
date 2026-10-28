import mongoose from 'mongoose';

const printerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true, default: 0 },
    maintenancePercent: { type: Number, default: 0.25 },
    maintenanceCost: { type: Number, default: 0 },
    lifespanHours: { type: Number, required: true, default: 5000 },
    powerKw: { type: Number, required: true, default: 0.125 }, // 125W default
    depreciationPerHour: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Pre-save to recalculate depreciation
printerSchema.pre('save', function (next) {
  this.maintenanceCost = this.price * (this.maintenancePercent || 0.25);
  this.depreciationPerHour = this.lifespanHours > 0 ? (this.price + this.maintenanceCost) / this.lifespanHours : 0;
  next();
});

export const PrinterModel = mongoose.model('Printer', printerSchema);
