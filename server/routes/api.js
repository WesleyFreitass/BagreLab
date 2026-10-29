import express from 'express';
import mongoose from 'mongoose';
import { PrinterModel } from '../models/Printer.js';
import { MaterialModel } from '../models/Material.js';
import { SettingModel } from '../models/Setting.js';
import { QuoteModel } from '../models/Quote.js';
import { CustomerModel } from '../models/Customer.js';

const router = express.Router();

// Fallback imediato se o MongoDB estiver offline (evita buffering de 10s do Mongoose)
router.use((req, res, next) => {
  if (req.path === '/whatsapp/send' || req.path === '/makerworld/parse') return next();
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: 'MongoDB não conectado. Modo offline ativo.' });
  }
  next();
});

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

// --- CLIENTES ---
router.get('/customers', async (req, res) => {
  try {
    const customers = await CustomerModel.find().sort({ name: 1 });
    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/customers', async (req, res) => {
  try {
    const { name, phone, email, googleId, avatarUrl, document, city, state, address, notes } = req.body;
    
    // Evita duplicar cliente se j existir pelo telefone ou e-mail
    const cleanPhone = phone ? phone.replace(/\D/g, '') : '';
    let existing = null;
    if (cleanPhone && cleanPhone.length >= 8) {
      existing = await CustomerModel.findOne({
        phone: { $regex: cleanPhone.slice(-8) }
      });
    }
    if (!existing && email) {
      existing = await CustomerModel.findOne({ email: email.toLowerCase() });
    }
    if (!existing && googleId) {
      existing = await CustomerModel.findOne({ googleId });
    }

    if (existing) {
      if (name) existing.name = name;
      if (phone) existing.phone = phone;
      if (email) existing.email = email;
      if (googleId) existing.googleId = googleId;
      if (avatarUrl) existing.avatarUrl = avatarUrl;
      if (notes) existing.notes = notes;
      await existing.save();
      return res.status(200).json(existing);
    }

    const customer = new CustomerModel({
      name,
      phone,
      email,
      googleId,
      avatarUrl,
      document,
      city,
      state,
      address,
      notes,
    });
    await customer.save();
    res.status(201).json(customer);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/customers/:id', async (req, res) => {
  try {
    const customer = await CustomerModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(customer);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/customers/:id', async (req, res) => {
  try {
    await CustomerModel.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// --- DISPARO WHATSAPP ---
router.post('/whatsapp/send', async (req, res) => {
  try {
    const { phone, message, quoteId } = req.body;
    if (!phone || !message) {
      return res.status(400).json({ error: 'Telefone e mensagem são obrigatórios.' });
    }

    // Normaliza telefone brasileiro (garante DDI 55)
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length === 10 || cleanPhone.length === 11) {
      cleanPhone = `55${cleanPhone}`;
    }

    const settings = mongoose.connection.readyState === 1
      ? await SettingModel.findOne({ key: 'global' }).catch(() => null)
      : null;
    
    // Se houver Evolution API ou Gateway configurado na VPS
    if (settings?.whatsappApiUrl) {
      try {
        const payload = {
          number: cleanPhone,
          text: message,
          textMessage: { text: message }
        };

        const headers = { 'Content-Type': 'application/json' };
        if (settings.whatsappApiKey) {
          headers['apikey'] = settings.whatsappApiKey;
          headers['Authorization'] = `Bearer ${settings.whatsappApiKey}`;
        }

        const response = await fetch(settings.whatsappApiUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(10000),
        });

        if (response.ok) {
          if (quoteId) {
            await QuoteModel.findByIdAndUpdate(quoteId, { status: 'sent' });
          }
          return res.json({
            success: true,
            mode: 'api',
            message: 'Mensagem enviada com sucesso via WhatsApp API!',
          });
        }
      } catch (apiErr) {
        console.warn('⚠️ Falha ao disparar via WhatsApp API, gerando link alternativo:', apiErr.message);
      }
    }

    // Modo Padrão: Link direto para WhatsApp Web / App
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
    
    if (quoteId) {
      await QuoteModel.findByIdAndUpdate(quoteId, { status: 'sent' });
    }

    return res.json({
      success: true,
      mode: 'link',
      whatsappUrl,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- PARSER MAKERWORLD (ORÇAMENTO AUTOMÁTICO) ---
router.post('/makerworld/parse', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL do MakerWorld é obrigatória.' });
    }

    // Validação estrita para aceitar somente MakerWorld
    if (!url.toLowerCase().includes('makerworld.com')) {
      return res.status(400).json({
        error: 'Apenas links oficiais da plataforma MakerWorld são aceitos (ex: https://makerworld.com/pt/models/13038-flying-fish).'
      });
    }

    // Extrai o ID numérico do modelo (ex: models/13038)
    const matchId = url.match(/models\/(\d+)/i);
    if (!matchId) {
      return res.status(400).json({
        error: 'Não foi possível identificar o ID do modelo na URL. Formato esperado: makerworld.com/.../models/{id}...'
      });
    }
    const modelId = matchId[1];

    // Extrai o profileId específico do hash se presente (ex: #profileId-83672)
    const matchProfile = url.match(/profileId[-=](\d+)/i);
    const requestedProfileId = matchProfile ? Number(matchProfile[1]) : null;

    // Consulta a API de design oficial da Bambu Lab / MakerWorld
    const apiRes = await fetch(`https://api.bambulab.com/v1/design-service/design/${modelId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json'
      },
      signal: AbortSignal.timeout(10000)
    });

    if (!apiRes.ok) {
      return res.status(apiRes.status).json({
        error: `Modelo nº ${modelId} não encontrado no MakerWorld ou indisponível.`
      });
    }

    const d = await apiRes.json();
    const rawInstances = Array.isArray(d.instances) ? d.instances : [];

    if (rawInstances.length === 0) {
      return res.status(404).json({
        error: 'Nenhum perfil de impressão fatiado encontrado para este modelo no MakerWorld.'
      });
    }

    const instances = rawInstances.map((inst) => {
      const seconds = Number(inst.prediction) || 0;
      const totalHours = seconds / 3600;
      const printDays = Math.floor(totalHours / 24);
      const remainingHours = totalHours % 24;
      const printHours = Math.floor(remainingHours);
      const printMinutes = Math.round((remainingHours - printHours) * 60);

      const filaments = (inst.instanceFilaments || []).map((f) => ({
        type: (f.type || 'PLA').toUpperCase(),
        color: f.color || '#3b82f6',
        usedG: Number(f.usedG) || 0,
        usedM: Number(f.usedM) || 0,
      }));

      const compatList = [];
      if (inst.extention?.modelInfo?.compatibility?.devProductName) {
        compatList.push(inst.extention.modelInfo.compatibility.devProductName);
      }
      if (Array.isArray(inst.extention?.modelInfo?.otherCompatibility)) {
        inst.extention.modelInfo.otherCompatibility.forEach((c) => {
          if (c.devProductName && !compatList.includes(c.devProductName)) {
            compatList.push(c.devProductName);
          }
        });
      }

      return {
        id: inst.id,
        title: inst.title || 'Perfil de Impressão',
        predictionSeconds: seconds,
        totalHours,
        printDays,
        printHours,
        printMinutes,
        weightGrams: Number(inst.weight) || 0,
        platesCount: inst.extention?.modelInfo?.plates?.length || 1,
        nozzleDiameter: inst.extention?.modelInfo?.compatibility?.nozzleDiameter || 0.4,
        compatibilityPrinters: compatList,
        filaments,
        isDefault: Boolean(inst.isDefault || inst.id === d.defaultInstanceId),
      };
    });

    let selectedInstance = null;
    if (requestedProfileId) {
      selectedInstance = instances.find((i) => i.id === requestedProfileId);
    }
    if (!selectedInstance) {
      selectedInstance = instances.find((i) => i.isDefault) || instances[0];
    }

    const result = {
      designId: Number(modelId),
      title: d.title || 'Modelo MakerWorld',
      coverUrl: d.coverUrl || (instances[0]?.cover || ''),
      creatorName: d.designCreator?.name || 'Designer MakerWorld',
      creatorAvatar: d.designCreator?.avatar || '',
      instances,
      selectedInstance,
      sourceUrl: url,
    };

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao consultar MakerWorld: ' + err.message });
  }
});

export default router;
