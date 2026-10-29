import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true }, // WhatsApp com DDD (ex: 11999998888)
    email: { type: String, trim: true, default: '' },
    document: { type: String, trim: true, default: '' }, // CPF ou CNPJ
    googleId: { type: String, default: '' },
    avatarUrl: { type: String, default: '' },
    city: { type: String, trim: true, default: '' },
    state: { type: String, trim: true, default: '' },
    address: { type: String, trim: true, default: '' },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

customerSchema.index({ name: 'text', phone: 'text' });

export const CustomerModel = mongoose.model('Customer', customerSchema);
