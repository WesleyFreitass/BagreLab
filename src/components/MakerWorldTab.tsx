import React, { useState, useEffect } from 'react';
import {
  Printer,
  Material,
  WorkshopSettings,
  MakerWorldModelData,
  MakerWorldInstance,
  MakerWorldFilamentSlot,
  QuoteItem,
  AuthUser,
  SavedQuote,
} from '../lib/types';
import { parseMakerWorldUrl } from '../lib/api';
import { calculateQuote, formatCurrency, formatHours, formatColorLabel } from '../lib/calculator';
import {
  Sparkles,
  Link as LinkIcon,
  Search,
  AlertCircle,
  ExternalLink,
  MessageSquare,
  ArrowRight,
  Sliders,
  CheckCircle2,
  Rocket,
  Palette,
  Share2,
  Send,
  AlertTriangle,
  Package,
} from 'lucide-react';

interface MakerWorldTabProps {
  printers: Printer[];
  materials: Material[];
  settings: WorkshopSettings;
  currentUser: AuthUser;
  onRequireAuth: () => void;
  onSubmitClientQuote?: (
    quoteData: Partial<SavedQuote>,
    decision: 'confirm_quote' | 'direct_print'
  ) => Promise<SavedQuote>;
  onImportToCalculator?: (data: {
    modelTitle: string;
    items: QuoteItem[];
    notes?: string;
  }) => void;
  onNavigateToMyRequests?: () => void;
}

export const MakerWorldTab: React.FC<MakerWorldTabProps> = ({
  printers,
  materials,
  settings,
  currentUser,
  onRequireAuth,
  onSubmitClientQuote,
  onImportToCalculator,
  onNavigateToMyRequests,
}) => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modelData, setModelData] = useState<MakerWorldModelData | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<MakerWorldInstance | null>(null);

  // Per-filament slot customization
  const [filamentSlots, setFilamentSlots] = useState<MakerWorldFilamentSlot[]>([]);

  // Workshop calibration overrides
  const [selectedPrinterId, setSelectedPrinterId] = useState<string>(printers[0]?.id || '');
  const [profitMargin, setProfitMargin] = useState(settings.defaultProfitMarginPercent || 50);

  // Quantity of parts requested
  const [quantity, setQuantity] = useState(1);

  // Decision selection ('confirm_quote' | 'direct_print')
  const [selectedDecision, setSelectedDecision] = useState<'confirm_quote' | 'direct_print'>('confirm_quote');

  // Submission & modal states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedQuote, setSubmittedQuote] = useState<SavedQuote | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [pendingDecision, setPendingDecision] = useState<'confirm_quote' | 'direct_print' | null>(null);

  const isMaker = currentUser.role === 'maker';

  // Initialize filament slots whenever selectedProfile changes
  useEffect(() => {
    if (!selectedProfile) {
      setFilamentSlots([]);
      return;
    }

    const initialSlots: MakerWorldFilamentSlot[] = selectedProfile.filaments.map((f, idx) => {
      // Find default matching material by type
      const fType = (f.type || 'PLA').toUpperCase();
      const match = materials.find(
        (m) => m.type.toUpperCase().includes(fType) || m.name.toUpperCase().includes(fType)
      ) || materials[0];

      return {
        slotIndex: idx,
        originalType: f.type || 'PLA',
        originalColor: f.color || '#3b82f6',
        usedG: f.usedG || 10,
        usedM: f.usedM,
        selectedMaterialId: match ? match.id : materials[0]?.id || '',
        customColorName: '',
        customColorHex: f.color || '#3b82f6',
      };
    });

    setFilamentSlots(initialSlots);
  }, [selectedProfile, materials]);

  const handleFetch = async (targetUrl = url) => {
    if (!targetUrl || !targetUrl.trim()) {
      setError('Por favor, informe a URL do modelo no MakerWorld.');
      return;
    }

    if (!targetUrl.toLowerCase().includes('makerworld.com')) {
      setError('Apenas links oficiais da plataforma MakerWorld são aceitos.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await parseMakerWorldUrl(targetUrl.trim());
      setModelData(data);
      const defaultProf = data.selectedInstance || data.instances[0] || null;
      setSelectedProfile(defaultProf);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao carregar dados do MakerWorld.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectProfile = (instanceId: number) => {
    if (!modelData) return;
    const found = modelData.instances.find((i) => i.id === instanceId);
    if (found) {
      setSelectedProfile(found);
    }
  };

  // Update a single filament slot
  const handleSlotMaterialChange = (slotIndex: number, materialId: string) => {
    setFilamentSlots((prev) =>
      prev.map((slot) => (slot.slotIndex === slotIndex ? { ...slot, selectedMaterialId: materialId } : slot))
    );
  };

  const handleSlotNotesChange = (slotIndex: number, notes: string) => {
    setFilamentSlots((prev) =>
      prev.map((slot) =>
        slot.slotIndex === slotIndex
          ? { ...slot, customColorName: notes }
          : slot
      )
    );
  };

  // Multi-material calculation: Machine print time is applied once, material weights are attributed per slot, multiplied by quantity
  const calculation = React.useMemo(() => {
    if (!selectedProfile || filamentSlots.length === 0) return null;

    const currentPrinter = printers.find((p) => p.id === selectedPrinterId) || printers[0];

    const quoteItems: QuoteItem[] = filamentSlots.map((slot, idx) => ({
      id: `mw-slot-${idx}`,
      name: `${modelData?.title || 'Modelo'} [Slot ${idx + 1} - ${slot.originalType}]`,
      materialId: slot.selectedMaterialId || materials[0]?.id || 'mat-1',
      printerId: currentPrinter?.id || 'printer-1',
      weightGrams: (slot.usedG || 0) * quantity,
      // Only attribute print time to the first slot so hours are not multiplied across slots, but scaled by quantity
      printDays: idx === 0 ? selectedProfile.printDays * quantity : 0,
      printHours: idx === 0 ? selectedProfile.printHours * quantity : 0,
      printMinutes: idx === 0 ? selectedProfile.printMinutes * quantity : 0,
      quantity: 1,
    }));

    return calculateQuote(
      quoteItems,
      materials,
      currentPrinter ? [currentPrinter] : printers,
      {
        ...settings,
        defaultProfitMarginPercent: profitMargin,
      },
      [
        { id: 'act-1', name: 'Preparação & Fatiamento MakerWorld', minutes: 10 },
        { id: 'act-2', name: 'Troca de Mesa & Pós-processamento', minutes: 15 },
      ],
      [],
      profitMargin,
      settings.taxesPercent || 0,
      settings.cardFeePercent || 0,
      settings.onlinePlatformFeePercent || 0,
      0
    );
  }, [selectedProfile, filamentSlots, selectedPrinterId, profitMargin, modelData, printers, materials, settings, quantity]);

  // Handle client quote submission
  const handleSubmitDecision = async (
    decision: 'confirm_quote' | 'direct_print',
    override?: {
      modelData?: MakerWorldModelData;
      selectedProfile?: MakerWorldInstance;
      filamentSlots?: MakerWorldFilamentSlot[];
      selectedPrinterId?: string;
    }
  ) => {
    // Verify authentication
    if (!currentUser.email || !currentUser.phone || currentUser.phone.replace(/\D/g, '').length < 10) {
      setPendingDecision(decision);
      try {
        sessionStorage.setItem(
          'bagrelab_pending_quote_state',
          JSON.stringify({
            url,
            decision,
            quantity,
            modelData,
            selectedProfile,
            filamentSlots,
            selectedPrinterId,
          })
        );
      } catch {}
      onRequireAuth();
      return;
    }

    const activeProfile = override?.selectedProfile || selectedProfile;
    const activeModel = override?.modelData || modelData;
    const activeSlots = override?.filamentSlots || filamentSlots;
    const activePrinterId = override?.selectedPrinterId || selectedPrinterId;

    if (!activeProfile || !activeModel || activeSlots.length === 0) return;

    setIsSubmitting(true);

    try {
      const currentPrinter = printers.find((p) => p.id === activePrinterId) || printers[0];

      const currentCalc =
        calculation ||
        calculateQuote(
          activeSlots.map((slot, idx) => ({
            id: `mw-slot-${idx}`,
            name: `${activeModel.title} [Slot ${idx + 1} - ${slot.originalType}]`,
            materialId: slot.selectedMaterialId || materials[0]?.id || 'mat-1',
            printerId: currentPrinter?.id || 'printer-1',
            weightGrams: (slot.usedG || 0) * quantity,
            printDays: idx === 0 ? activeProfile.printDays * quantity : 0,
            printHours: idx === 0 ? activeProfile.printHours * quantity : 0,
            printMinutes: idx === 0 ? activeProfile.printMinutes * quantity : 0,
            quantity: 1,
          })),
          materials,
          currentPrinter ? [currentPrinter] : printers,
          {
            ...settings,
            defaultProfitMarginPercent: profitMargin,
          },
          [
            { id: 'act-1', name: 'Preparação & Fatiamento MakerWorld', minutes: 10 },
            { id: 'act-2', name: 'Troca de Mesa & Pós-processamento', minutes: 15 },
          ],
          [],
          profitMargin,
          settings.taxesPercent || 0,
          settings.cardFeePercent || 0,
          settings.onlinePlatformFeePercent || 0,
          0
        );

      const quotePayload: Partial<SavedQuote> = {
        quoteNumber: `MW-${Date.now().toString().slice(-6)}`,
        customerName: currentUser.name || 'Cliente MakerWorld',
        customerPhone: currentUser.phone,
        customerEmail: currentUser.email,
        customerContact: currentUser.phone,
        date: new Date().toLocaleDateString('pt-BR'),
        status: decision === 'direct_print' ? 'approved' : 'pending_review',
        clientDecision: decision,
        quantity,
        paymentStatus: 'pending',
        makerWorldData: {
          designId: activeModel.designId,
          modelTitle: activeModel.title,
          profileTitle: activeProfile.title,
          sourceUrl: activeModel.sourceUrl,
          coverUrl: activeModel.coverUrl,
          filaments: activeSlots,
        },
        items: activeSlots.map((slot, idx) => ({
          id: `item-${idx}`,
          name: `${activeModel.title} (Slot ${idx + 1} - ${slot.originalType})`,
          materialId: slot.selectedMaterialId,
          printerId: activePrinterId || printers[0]?.id || '',
          weightGrams: (slot.usedG || 0) * quantity,
          printDays: idx === 0 ? activeProfile.printDays * quantity : 0,
          printHours: idx === 0 ? activeProfile.printHours * quantity : 0,
          printMinutes: idx === 0 ? activeProfile.printMinutes * quantity : 0,
          quantity: 1,
        })),
        laborActivities: [
          { id: 'act-1', name: 'Preparação & Fatiamento MakerWorld', minutes: 10 },
          { id: 'act-2', name: 'Troca de Mesa & Pós-processamento', minutes: 15 },
        ],
        consumables: [],
        profitMarginPercent: profitMargin,
        taxesPercent: settings.taxesPercent || 0,
        cardFeePercent: settings.cardFeePercent || 0,
        onlinePlatformFeePercent: settings.onlinePlatformFeePercent || 0,
        shippingCost: 0,
        notes: `Solicitação via Portal MakerWorld (BagreLab).\nQuantidade: ${quantity} unidade(s)\nDecisão do Cliente: ${
          decision === 'direct_print' ? 'Pode Imprimir! (Aprovação de Produção)' : 'Confirmar Orçamento Final'
        }\nPerfil: ${activeProfile.title}\nCores/Materiais: ${activeSlots
          .map((s) => {
            const mat = materials.find((m) => m.id === s.selectedMaterialId);
            return `${s.originalType} (${s.usedG * quantity}g) -> ${mat?.name || ''} [Obs: ${s.customColorName || 'Sem obs'}]`;
          })
          .join(', ')}`,
        calculation: currentCalc,
      };

      if (onSubmitClientQuote) {
        const saved = await onSubmitClientQuote(quotePayload, decision);
        setSubmittedQuote(saved);
      } else {
        setSubmittedQuote({
          ...quotePayload,
          id: `quote-${Date.now()}`,
          createdAt: new Date().toISOString(),
        } as SavedQuote);
      }

      setShowSuccessModal(true);
    } catch (err: any) {
      console.error(err);
      alert('Erro ao enviar solicitação: ' + (err.message || 'Tente novamente.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // If user just authenticated and had a pending decision, submit automatically
  useEffect(() => {
    try {
      const savedRaw = sessionStorage.getItem('bagrelab_pending_quote_state');
      if (savedRaw && currentUser.email && currentUser.phone && currentUser.phone.replace(/\D/g, '').length >= 10) {
        const parsed = JSON.parse(savedRaw);
        sessionStorage.removeItem('bagrelab_pending_quote_state');
        if (parsed.modelData && parsed.decision && parsed.selectedProfile) {
          setModelData(parsed.modelData);
          setSelectedProfile(parsed.selectedProfile);
          if (parsed.filamentSlots) setFilamentSlots(parsed.filamentSlots);
          if (parsed.selectedPrinterId) setSelectedPrinterId(parsed.selectedPrinterId);
          if (parsed.url) setUrl(parsed.url);
          setTimeout(() => {
            handleSubmitDecision(parsed.decision, {
              modelData: parsed.modelData,
              selectedProfile: parsed.selectedProfile,
              filamentSlots: parsed.filamentSlots,
              selectedPrinterId: parsed.selectedPrinterId,
            });
          }, 350);
          return;
        }
      }
    } catch {}

    if (pendingDecision && currentUser.phone && currentUser.phone.replace(/\D/g, '').length >= 10) {
      const dec = pendingDecision;
      setPendingDecision(null);
      handleSubmitDecision(dec);
    }
  }, [currentUser, pendingDecision]);

  // Handle direct import to main calculator (Maker mode)
  const handleImport = () => {
    if (!selectedProfile || !modelData) return;

    const filamentsSummary = filamentSlots
      .map((f) => `${f.originalType} (${f.usedG}g)`)
      .join(' | ');

    onImportToCalculator?.({
      modelTitle: modelData.title,
      notes: `Importado do MakerWorld (#${modelData.designId})\nPerfil: ${selectedProfile.title}\nFilamentos: ${filamentsSummary}\nLink: ${modelData.sourceUrl}`,
      items: filamentSlots.map((slot, idx) => ({
        id: `mw-slot-${Date.now()}-${idx}`,
        name: `${modelData.title} - Slot ${idx + 1} (${slot.originalType})`,
        materialId: slot.selectedMaterialId || materials[0]?.id || 'mat-1',
        printerId: selectedPrinterId || printers[0]?.id || 'kobra-1',
        weightGrams: slot.usedG,
        printDays: idx === 0 ? selectedProfile.printDays : 0,
        printHours: idx === 0 ? selectedProfile.printHours : 0,
        printMinutes: idx === 0 ? selectedProfile.printMinutes : 0,
      })),
    });
  };

  // Send pre-filled WhatsApp message to Maker
  const handleOpenMakerWhatsApp = () => {
    if (!submittedQuote || !modelData || !calculation) return;

    const decisionText =
      submittedQuote.clientDecision === 'direct_print'
        ? '🚀 *PODE IMPRIMIR!* (Aprovação de Produção)'
        : '📋 *CONFIRMAR ORÇAMENTO FINAL* (Revisar Detalhes)';

    const msg = `Olá! Acabei de enviar um pedido no *BagreLab* referente ao modelo do MakerWorld:

📦 *Peça:* ${modelData.title}
🔖 *Código:* #${submittedQuote.quoteNumber}
🎯 *Minha Decisão:* ${decisionText}
💰 *Valor Estimado:* ${formatCurrency(calculation.salePriceCash)}
🎨 *Materiais Selecionados:*
${filamentSlots
  .map((s, i) => {
    const mat = materials.find((m) => m.id === s.selectedMaterialId);
    return `  • Slot ${i + 1} (${s.originalType}): ${mat?.name || 'Padrão'} ${
      s.customColorName ? `(Obs: ${s.customColorName})` : ''
    }`;
  })
  .join('\n')}

👤 *Meu Nome:* ${currentUser.name}
📱 *Meu WhatsApp:* ${currentUser.phone}

Podemos prosseguir com o pedido?`;

    // Send to Maker phone if available in settings, or standard share
    const targetPhone = settings.whatsappInstance || '';
    const cleanPhone = targetPhone.replace(/\D/g, '');
    const targetUrl = cleanPhone
      ? `https://api.whatsapp.com/send?phone=55${cleanPhone}&text=${encodeURIComponent(msg)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;

    window.open(targetUrl, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <Sparkles className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Orçamento Automático MakerWorld
            </h2>
          </div>
          <p className="text-sm text-slate-500">
            Cole a URL de qualquer peça do <strong>MakerWorld</strong> para extrair tempo, consumo de filamentos e orçar instantaneamente no BagreLab.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="https://makerworld.com"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs px-3.5 py-2.5 rounded-lg border border-slate-300 transition-colors shrink-0 shadow-2xs"
          >
            <span>Explorar no MakerWorld</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
          </a>
        </div>
      </div>

      {/* URL Input Box (Stripe Clean Style) */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
          Link da Peça no MakerWorld:
        </label>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Cole o link da peça (ex: https://makerworld.com/pt/models/13038-flying-fish...)"
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={() => handleFetch(url)}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-5 py-2.5 rounded-lg shadow-2xs transition-colors cursor-pointer shrink-0 disabled:opacity-50"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            <span>{isLoading ? 'Analisando Modelo...' : 'Extrair Métricas & Orçar'}</span>
          </button>

          <a
            href="https://makerworld.com"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs px-4 py-2.5 rounded-lg border border-slate-300 transition-colors cursor-pointer shrink-0"
            title="Abrir o MakerWorld em uma nova aba"
          >
            <span>Abrir MakerWorld</span>
            <ExternalLink className="w-4 h-4 text-slate-600" />
          </a>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* In-page confirmation banner after submitting quote */}
      {submittedQuote && (
        <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50 border-2 border-emerald-300 text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm sm:text-base text-slate-900">
                  Pedido #{submittedQuote.quoteNumber} Enviado com Sucesso!
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-200 text-emerald-800">
                  {submittedQuote.clientDecision === 'direct_print' ? 'Pode Imprimir' : 'Orçamento'}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Sua solicitação foi registrada no sistema da BagreLab. O Maker entrará em contato via WhatsApp.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowSuccessModal(true)}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors cursor-pointer shadow-xs"
            >
              Ver Detalhes do Envio
            </button>
            {onNavigateToMyRequests && (
              <button
                type="button"
                onClick={onNavigateToMyRequests}
                className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold text-xs transition-colors cursor-pointer"
              >
                Minhas Solicitações
              </button>
            )}
          </div>
        </div>
      )}

      {/* Result Section when Model is Fetched */}
      {modelData && selectedProfile && calculation && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Model Details & Per-Slot Material Selection (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Model Card Header */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-start gap-4">
                {modelData.coverUrl && (
                  <img
                    src={modelData.coverUrl}
                    alt={modelData.title}
                    className="w-20 h-20 rounded-xl object-cover border border-slate-200 shadow-2xs shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      MakerWorld Oficial
                    </span>
                    <span className="text-xs text-slate-400 font-mono">#{modelData.designId}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 truncate">
                    {modelData.title}
                  </h3>
                  <div className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                    <span>Designer: <strong>{modelData.creatorName}</strong></span>
                    <span>•</span>
                    <a
                      href={modelData.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:underline inline-flex items-center gap-1 font-medium"
                    >
                      <span>Ver no MakerWorld</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Profile Selector if multiple profiles exist */}
              {modelData.instances.length > 1 && (
                <div className="bg-slate-50/70 px-5 py-3 border-b border-slate-200 flex items-center justify-between gap-3 text-xs">
                  <span className="text-slate-600 font-semibold shrink-0">
                    Perfil de Impressão:
                  </span>
                  <select
                    value={selectedProfile.id}
                    onChange={(e) => handleSelectProfile(Number(e.target.value))}
                    className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full max-w-sm truncate"
                  >
                    {modelData.instances.map((inst) => (
                      <option key={inst.id} value={inst.id}>
                        {inst.title} ({inst.weightGrams}g, ~{formatHours(inst.totalHours)})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Specs Grid */}
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Mesa / Pratos</span>
                    <strong className="text-sm text-slate-900 font-mono">
                      {selectedProfile.platesCount} Prato{selectedProfile.platesCount > 1 ? 's' : ''}
                    </strong>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Tempo Estimado</span>
                    <strong className="text-sm text-slate-900 font-mono">
                      {formatHours(selectedProfile.totalHours)}
                    </strong>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Bico Recomendado</span>
                    <strong className="text-sm text-slate-900 font-mono">
                      {selectedProfile.nozzleDiameter} mm
                    </strong>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Peso Total</span>
                    <strong className="text-sm text-slate-900 font-mono">
                      {selectedProfile.weightGrams} g
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Per-Color & Per-Slot Material Customization (BASED ON WORKSHOP INVENTORY) */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-blue-600" />
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Seleção de Filamentos & Cores por Slot
                  </h4>
                </div>
                <span className="text-xs text-slate-500 font-medium">
                  {filamentSlots.length} cor(es) necessária(s)
                </span>
              </div>

              <div className="space-y-3">
                {filamentSlots.map((slot, idx) => {
                  const selectedMat = materials.find((m) => m.id === slot.selectedMaterialId) || materials[0];
                  const slotCost = selectedMat ? (slot.usedG / 1000) * selectedMat.costPerKg : 0;

                  return (
                    <div
                      key={idx}
                      className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      {/* Left: Original MakerWorld color swatch and metrics */}
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full border border-slate-300 shadow-2xs shrink-0 flex items-center justify-center font-bold text-[10px]"
                          style={{
                            backgroundColor: slot.customColorHex || slot.originalColor,
                            color:
                              slot.originalColor === '#000000' || slot.originalColor === '#001489'
                                ? '#ffffff'
                                : '#1e293b',
                          }}
                          title={`Cor original no modelo: ${slot.originalColor}`}
                        >
                          #{idx + 1}
                        </div>

                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-900">
                              Slot {idx + 1}: {slot.originalType}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                              {slot.originalColor}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Consumo: <strong className="text-slate-800">{slot.usedG}g</strong>
                            {slot.usedM ? ` (~${slot.usedM.toFixed(1)}m)` : ''}
                          </div>
                        </div>
                      </div>

                      {/* Right: Stock Filament Selection & Observações */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 flex-1 max-w-md">
                        <div className="flex-1">
                          <label className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">
                            Filamento & Cor (Estoque):
                          </label>
                          <select
                            value={slot.selectedMaterialId}
                            onChange={(e) => handleSlotMaterialChange(slot.slotIndex, e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {materials.map((m) => {
                              const colorLabel = formatColorLabel(m.color);
                              return (
                                <option key={m.id} value={m.id}>
                                  {isMaker
                                    ? `${m.name} (${m.type}${colorLabel ? ` - Cor: ${colorLabel}` : ''} • ${formatCurrency(m.costPerKg)}/kg)`
                                    : `${m.name} (${m.type}${colorLabel ? ` - Cor: ${colorLabel}` : ''})`}
                                </option>
                              );
                            })}
                          </select>
                        </div>

                        {/* Observações Field (Replaced free-text color per request) */}
                        <div className="sm:w-36">
                          <label className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">
                            Observações:
                          </label>
                          <input
                            type="text"
                            value={slot.customColorName || ''}
                            onChange={(e) => handleSlotNotesChange(slot.slotIndex, e.target.value)}
                            placeholder="Ex: Acabamento, detalhe..."
                            className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        {/* Maker-Only: Subtotal */}
                        {isMaker && (
                          <div className="text-right sm:w-20 shrink-0">
                            <span className="text-[10px] font-semibold text-slate-400 uppercase block">
                              Subtotal
                            </span>
                            <span className="text-xs font-bold text-slate-900 font-mono">
                              {formatCurrency(slotCost)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Workshop Calibration Panel (Shown exclusively for Maker role) */}
            {isMaker && (
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Sliders className="w-4 h-4 text-blue-600" />
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Ajustes de Oficina (Visão Maker)
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-slate-600 font-semibold block mb-1">Impressora Alocada</label>
                    <select
                      value={selectedPrinterId}
                      onChange={(e) => setSelectedPrinterId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {printers.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({formatCurrency(p.depreciationPerHour)}/h)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-600 font-semibold block mb-1">
                      Margem de Lucro: <strong className="text-blue-600">{profitMargin}%</strong>
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="80"
                      step="5"
                      value={profitMargin}
                      onChange={(e) => setProfitMargin(Number(e.target.value))}
                      className="w-full mt-2 accent-blue-600 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handleImport}
                    className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 text-xs font-semibold cursor-pointer"
                  >
                    <span>Importar itens para Calculadora Geral</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* Right Column: Final Price & Decision Selection (5 Cols) */}
          <div className="lg:col-span-5 space-y-5">
            
            {/* Quantity Selector Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-slate-900 block">Quantidade de Peças</span>
                <span className="text-[11px] text-slate-500">
                  {quantity > 1 ? `Multiplica tempo e material por ${quantity}` : '1 unidade deste modelo'}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                  disabled={quantity <= 1}
                  className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-base flex items-center justify-center transition-colors disabled:opacity-40 cursor-pointer"
                  title="Diminuir quantidade"
                >
                  -
                </button>
                <div className="w-12 text-center">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                    className="w-full text-center font-mono font-bold text-sm text-slate-900 bg-slate-50 rounded-md py-1 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setQuantity((prev) => Math.min(100, prev + 1))}
                  className="w-8 h-8 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-base flex items-center justify-center transition-colors cursor-pointer"
                  title="Aumentar quantidade"
                >
                  +
                </button>
              </div>
            </div>

            {/* Price Hero Box */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="bg-slate-900 text-white p-6 text-center space-y-1">
                <span className="text-xs text-slate-400 uppercase font-bold tracking-wider block font-mono">
                  {quantity > 1 ? `Valor Estimado Total (${quantity} unidades)` : 'Valor Estimado de Produção (À Vista / PIX)'}
                </span>
                <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white py-1">
                  {formatCurrency(calculation.salePriceCash)}
                </div>
                <span className="text-[11px] text-slate-400 block">
                  {selectedProfile.weightGrams * quantity}g no total • ~{formatHours(selectedProfile.totalHours * quantity)} de impressão
                  {quantity > 1 && ` • ${formatCurrency(calculation.salePriceCash / quantity)} / un.`}
                </span>
              </div>

              {/* DRE Summary List: SHOWN ONLY FOR MAKER (Client sees NO internal costs, per request) */}
              {isMaker && (
                <div className="p-5 space-y-2.5 text-xs text-slate-600 border-t border-slate-100">
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span>Filamento ({selectedProfile.weightGrams}g em {filamentSlots.length} cor/cores)</span>
                    <span className="font-mono font-medium text-slate-800">{formatCurrency(calculation.materialCost)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span>Depreciação Máquina (~{formatHours(selectedProfile.totalHours)})</span>
                    <span className="font-mono font-medium text-slate-800">{formatCurrency(calculation.depreciationCost)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span>Energia Elétrica</span>
                    <span className="font-mono font-medium text-slate-800">{formatCurrency(calculation.electricityCost)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span>Risco de Falhas ({settings.failureRatePercent || 15}%)</span>
                    <span className="font-mono font-medium text-slate-800">{formatCurrency(calculation.failureCost)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span>Mão de Obra Oficina</span>
                    <span className="font-mono font-medium text-slate-800">{formatCurrency(calculation.laborCost)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 font-bold text-slate-900 bg-slate-50 px-2 rounded-lg">
                    <span>Custo de Produção da Oficina</span>
                    <span className="font-mono">{formatCurrency(calculation.totalProductionCost)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 text-emerald-700 font-semibold px-2">
                    <span>Lucro Líquido Estimado ({profitMargin}%)</span>
                    <span className="font-mono">{formatCurrency(calculation.profitCost)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* CLIENT DECISION SELECTION & SUBMIT BUTTON */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-1">
                  Selecione sua Decisão para Prosseguir:
                </h4>
                <p className="text-xs text-slate-500">
                  Escolha uma das opções abaixo e clique em Enviar Pedido.
                </p>
              </div>

              <div className="space-y-3">
                {/* Option 1: Confirmar Orçamento Final */}
                <div
                  onClick={() => setSelectedDecision('confirm_quote')}
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                    selectedDecision === 'confirm_quote'
                      ? 'border-blue-600 bg-blue-50/50 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                        selectedDecision === 'confirm_quote'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      <MessageSquare className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">
                          Confirmar Orçamento Final
                        </span>
                        <span className="text-[10px] font-semibold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-full">
                          Revisão
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                        Tire dúvidas sobre prazos, cores ou envie observações específicas antes de iniciar a impressão.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Option 2: Pode Imprimir! (Clear warning that price can be adjusted) */}
                <div
                  onClick={() => setSelectedDecision('direct_print')}
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                    selectedDecision === 'direct_print'
                      ? 'border-emerald-600 bg-emerald-50/50 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                        selectedDecision === 'direct_print'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      <Rocket className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">
                          Pode Imprimir!
                        </span>
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                          Aprovação de Produção
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                        Autorizo a entrada na fila de impressão prioritária da oficina.
                      </p>

                      {/* Warning Notice: Value is subject to technical confirmation */}
                      <div className="mt-2.5 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-start gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <span>
                          <strong>Atenção:</strong> O valor estimado pode sofrer pequenos ajustes após a análise técnica do Maker (necessidade de suportes complexos ou requisitos de pós-processamento).
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ENVIAR PEDIDO BUTTON (REPLACED "Visualizar Proposta em PDF") */}
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSubmitDecision(selectedDecision)}
                  className={`w-full py-3.5 px-5 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50 ${
                    selectedDecision === 'direct_print'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>
                        {selectedDecision === 'direct_print'
                          ? 'Enviar Pedido para Produção'
                          : 'Enviar Solicitação de Orçamento'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* Confirmation Modal after submitting quote */}
      {showSuccessModal && submittedQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 text-center space-y-5 animate-in fade-in zoom-in-95 duration-200 my-auto">
            
            {/* Success Icon */}
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center ring-8 ring-emerald-50">
              {submittedQuote.clientDecision === 'direct_print' ? (
                <Rocket className="w-8 h-8 text-emerald-600" />
              ) : (
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              )}
            </div>

            {/* Title & Badge */}
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold tracking-wider uppercase font-mono mb-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                <span>Confirmação de Envio</span>
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                {submittedQuote.clientDecision === 'direct_print'
                  ? 'Pedido Enviado para Produção'
                  : 'Solicitação de Orçamento Enviada'}
              </h3>
              <p className="text-xs text-slate-500 mt-1.5">
                Seu pedido foi registrado no sistema e enviado diretamente ao Maker da oficina.
              </p>
            </div>

            {/* Order Card Preview */}
            <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 text-xs text-left space-y-3 border border-slate-200">
              <div className="flex items-start gap-3 pb-3 border-b border-slate-200">
                {modelData?.coverUrl && (
                  <img
                    src={modelData.coverUrl}
                    alt={modelData.title}
                    className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-mono text-slate-400">
                    PEDIDO #{submittedQuote.quoteNumber}
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm truncate">
                    {modelData?.title}
                  </h4>
                  <div className="text-[11px] text-slate-500 truncate mt-0.5">
                    Perfil: {selectedProfile?.title}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Decisão Escolhida:</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded-md text-[11px] ${
                      submittedQuote.clientDecision === 'direct_print'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {submittedQuote.clientDecision === 'direct_print'
                      ? 'Pode Imprimir! (Autorizado)'
                      : 'Confirmar Orçamento Final'}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Contato WhatsApp:</span>
                  <strong className="text-slate-900 font-mono">{currentUser.phone}</strong>
                </div>

                <div className="flex justify-between items-center border-t border-slate-200 pt-2 font-bold text-sm">
                  <span className="text-slate-700">Valor Estimado:</span>
                  <span className="text-emerald-700 font-mono text-base font-black">
                    {formatCurrency(submittedQuote.calculation.salePriceCash)}
                  </span>
                </div>
              </div>

              {/* Informative next step notice */}
              <div className="bg-blue-50/80 p-2.5 rounded-xl border border-blue-100 text-[11px] text-blue-800 leading-relaxed">
                O Maker recebeu seus dados e entrará em contato via WhatsApp para confirmar prazos e detalhes de entrega.
              </div>
            </div>

            {/* CTAs */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleOpenMakerWhatsApp}
                className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>Notificar o Maker no WhatsApp com os Detalhes</span>
              </button>

              {onNavigateToMyRequests && (
                <button
                  type="button"
                  onClick={() => {
                    setShowSuccessModal(false);
                    onNavigateToMyRequests();
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Package className="w-4 h-4" />
                  <span>Acompanhar em Minhas Solicitações</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setShowSuccessModal(false);
                  setUrl('');
                  setModelData(null);
                  setSelectedProfile(null);
                }}
                className="w-full py-2.5 px-3 rounded-lg text-slate-500 hover:text-slate-800 font-medium text-xs transition-colors cursor-pointer"
              >
                <span>Fazer Novo Orçamento</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
