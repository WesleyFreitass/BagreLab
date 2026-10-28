import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import apiRoutes from './routes/api.js';
import { PrinterModel } from './models/Printer.js';
import { MaterialModel } from './models/Material.js';
import { SettingModel } from './models/Setting.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/3dcost';

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api', apiRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: '3DCost Fullstack API',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// Serve frontend SPA in production
const DIST_DIR = path.join(process.cwd(), 'dist');
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.get('*', (req, res, next) => {
    if (req.url.startsWith('/api')) return next();
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
}

// Seed initial database records from spreadsheet if empty
async function seedDefaultData() {
  try {
    const printersCount = await PrinterModel.countDocuments();
    if (printersCount === 0) {
      console.log('🌱 Populando impressoras padrão da planilha...');
      await PrinterModel.create({
        name: 'Anycubic Kobra',
        price: 3300,
        maintenancePercent: 0.25,
        maintenanceCost: 825,
        lifespanHours: 5000,
        powerKw: 0.125,
        depreciationPerHour: 0.825,
      });
    }

    const materialsCount = await MaterialModel.countDocuments();
    if (materialsCount === 0) {
      console.log('🌱 Populando materiais padrão da planilha...');
      await MaterialModel.insertMany([
        {
          name: 'PLA Caro',
          brand: 'Premium',
          costPerSpool: 135,
          weightSpoolKg: 1,
          costPerKg: 135,
          type: 'PLA',
          color: '#3b82f6',
        },
        {
          name: 'PLA Voolt',
          brand: 'Voolt3D',
          costPerSpool: 105,
          weightSpoolKg: 1,
          costPerKg: 105,
          type: 'PLA',
          color: '#10b981',
        },
        {
          name: 'PETG Benser',
          brand: 'Benser',
          costPerSpool: 119,
          weightSpoolKg: 1,
          costPerKg: 119,
          type: 'PETG',
          color: '#f59e0b',
        },
        {
          name: 'ABS Genérico',
          brand: 'Genérico',
          costPerSpool: 90,
          weightSpoolKg: 1,
          costPerKg: 90,
          type: 'ABS',
          color: '#8b5cf6',
        },
      ]);
    }

    const settingsCount = await SettingModel.countDocuments();
    if (settingsCount === 0) {
      console.log('🌱 Populando configurações e despesas da planilha...');
      await SettingModel.create({
        key: 'global',
        costPerKwh: 0.90,
        failureRatePercent: 15,
        productivePeople: 1,
        dailyHoursPerPerson: 8,
        daysPerMonth: 22,
        productivityPercent: 85,
        taxesPercent: 0,
        onlinePlatformFeePercent: 0,
        cardFeePercent: 0,
        defaultProfitMarginPercent: 50,
        fixedExpenses: [
          { id: 'exp-1', name: 'Energia Elétrica Geral', cost: 0 },
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
      });
    }
  } catch (err) {
    console.warn('⚠️ Erro ao popular dados iniciais:', err.message);
  }
}

// Start Server & Connect Database
async function startServer() {
  try {
    console.log(`🔌 Conectando ao MongoDB em ${MONGODB_URI}...`);
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✅ Conexão com MongoDB estabelecida com sucesso!');
    await seedDefaultData();
  } catch (err) {
    console.warn('⚠️ Não foi possível conectar ao MongoDB localmente:', err.message);
    console.warn('ℹ️ O servidor continuará em execução com fallback de saúde.');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 3DCost Server rodando na porta ${PORT}`);
  });
}

startServer();
