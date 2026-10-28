import mongoose from 'mongoose';

const materialSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    brand: { type: String, default: '' },
    costPerSpool: { type: Number, required: true, default: 0 },
    weightSpoolKg: { type: Number, required: true, default: 1 },
    costPerKg: { type: Number, default: 0 },
    type: { type: String, default: 'PLA' }, // PLA, PETG, ABS, TPU, Resina
    color: { type: String, default: '#3b82f6' },
  },
  { timestamps: true }
);

materialSchema.pre('save', function (next) {
  this.costPerKg = this.weightSpoolKg > 0 ? this.costPerSpool / this.weightSpoolKg : 0;
  next();
});

export const MaterialModel = mongoose.model('Material', materialSchema);
