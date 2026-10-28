import express from 'express';
import { PrinterModel } from '../models/Printer.js';
import { MaterialModel } from '../models/Material.js';
import { SettingModel } from '../models/Setting.js';
import { QuoteModel } from '../models/Quote.js';

const router = express.Router();

// --- IMPRESSORAS ---
router.get('/printers', async (req, res) => {
  try {
    const printers = await PrinterModel.find().sort({ createdAt: 1 });
    res.json(printers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/printers', async (req, res) => {
  try {
    const { name, price, maintenancePercent, lifespanHours, powerKw } = req.body;
    const maintenanceCost = price * (maintenancePercent || 0.25);
    const depreciationPerHour = lifespanHours > 0 ? (price + maintenanceCost) / lifespanHours : 0;

    const printer = new PrinterModel({
      name,
      price,
      maintenancePercent,
      maintenanceCost,
      lifespanHours,
      powerKw,
      depreciationPerHour,
    });
    await printer.save();
    res.status(201).json(printer);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/printers/:id', async (req, res) => {
  try {
    const { name, price, maintenancePercent, lifespanHours, powerKw } = req.body;
    const maintenanceCost = price * (maintenancePercent || 0.25);
    const depreciationPerHour = lifespanHours > 0 ? (price + maintenanceCost) / lifespanHours : 0;

    const printer = await PrinterModel.findByIdAndUpdate(
      req.params.id,
      {
        name,
        price,
        maintenancePercent,
        maintenanceCost,
        lifespanHours,
        powerKw,
        depreciationPerHour,
      },
      { new: true }
    );
    res.json(printer);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/printers/:id', async (req, res) => {
  try {
    await PrinterModel.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// --- MATERIAIS ---
router.get('/materials', async (req, res) => {
  try {
    const materials = await MaterialModel.find().sort({ createdAt: 1 });
    res.json(materials);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/materials', async (req, res) => {
  try {
    const { name, brand, costPerSpool, weightSpoolKg, type, color } = req.body;
    const costPerKg = weightSpoolKg > 0 ? costPerSpool / weightSpoolKg : 0;
    const material = new MaterialModel({
      name,
      brand,
      costPerSpool,
      weightSpoolKg,
      costPerKg,
      type,
      color,
    });
    await material.save();
    res.status(201).json(material);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/materials/:id', async (req, res) => {
  try {
    const { name, brand, costPerSpool, weightSpoolKg, type, color } = req.body;
    const costPerKg = weightSpoolKg > 0 ? costPerSpool / weightSpoolKg : 0;
    const material = await MaterialModel.findByIdAndUpdate(
      req.params.id,
      {
        name,
        brand,
        costPerSpool,
        weightSpoolKg,
        costPerKg,
        type,
        color,
      },
      { new: true }
    );
    res.json(material);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/materials/:id', async (req, res) => {
  try {
    await MaterialModel.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// --- CONFIGURAÇÕES DA OFICINA ---
router.get('/settings', async (req, res) => {
  try {
    let settings = await SettingModel.findOne({ key: 'global' });
    if (!settings) {
      settings = new SettingModel({ key: 'global' });
      await settings.save();
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/settings', async (req, res) => {
  try {
    const settings = await SettingModel.findOneAndUpdate(
      { key: 'global' },
      { ...req.body, key: 'global' },
      { new: true, upsert: true }
    );
    res.json(settings);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// --- ORÇAMENTOS (HISTÓRICO) ---
router.get('/quotes', async (req, res) => {
  try {
    const quotes = await QuoteModel.find().sort({ createdAt: -1 });
    res.json(quotes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/quotes', async (req, res) => {
  try {
    const quote = new QuoteModel(req.body);
    await quote.save();
    res.status(201).json(quote);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/quotes/:id', async (req, res) => {
  try {
    const quote = await QuoteModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(quote);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/quotes/:id', async (req, res) => {
  try {
    await QuoteModel.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
