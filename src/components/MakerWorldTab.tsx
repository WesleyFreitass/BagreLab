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
  MessageSquare,
  ArrowRight,
  Sliders,
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
  initialUrl?: string;
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
  initialUrl,
}) => {
  const [url, setUrl] = useState(initialUrl || '');
  const [isLoading, setIsLoading] = useState(false);

  // Model & Profile State - Zerado por padrão
  const [modelData, setModelData] = useState<MakerWorldModelData | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<MakerWorldInstance | null>(null);

  // Filament Slots
  const [filamentSlots, setFilamentSlots] = useState<MakerWorldFilamentSlot[]>([]);

  // Workshop calibration overrides
  const [selectedPrinterId, setSelectedPrinterId] = useState<string>(printers[0]?.id || '');
  const [profitMargin, setProfitMargin] = useState(settings.defaultProfitMarginPercent || 50);

  // Quantity of parts requested
  const [quantity, setQuantity] = useState(1);

  // Decision selection ('revisao' = 'confirm_quote' | 'imprimir' = 'direct_print')
  const [selectedDecision, setSelectedDecision] = useState<'revisao' | 'imprimir'>('revisao');

  // Submission & modal states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedQuote, setSubmittedQuote] = useState<SavedQuote | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [pendingDecision, setPendingDecision] = useState<'revisao' | 'imprimir' | null>(null);

  const isMaker = currentUser.role === 'maker';

  // Update a single filament slot with real material from stock
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

  const handleFetchModel = async (e?: React.FormEvent, customUrl?: string) => {
    if (e) e.preventDefault();
    const targetUrl = (customUrl || url).trim();
    if (!targetUrl) return;

    setIsLoading(true);

    try {
      const data = await parseMakerWorldUrl(targetUrl);
      setModelData(data);
      const defaultProf = data.selectedInstance || data.instances.find((i) => i.isDefault) || data.instances[0];
      setSelectedProfile(defaultProf);
      setFilamentSlots(
        defaultProf.filaments.map((f, idx) => ({
          slotIndex: idx,
          originalType: f.type || 'PLA',
          originalColor: f.color || '#3b82f6',
          usedG: f.usedG || 0,
          usedM: f.usedM || 0,
          selectedMaterialId: materials[0]?.id || 'mat-1',
          customColorName: '',
        }))
      );
    } catch (err: any) {
      alert(err.message || 'Falha ao buscar modelo do MakerWorld. Verifique a URL.');
    } finally {
      setIsLoading(false);
    }
  };

  // Carregar URL inicial caso venha de redirecionamento ou link externo
  useEffect(() => {
    if (initialUrl && initialUrl.trim()) {
      setUrl(initialUrl.trim());
      handleFetchModel(undefined, initialUrl.trim());
    }
  }, [initialUrl]);

  const handleSelectProfile = (profileId: number) => {
    if (!modelData) return;
    const prof = modelData.instances.find((i) => i.id === profileId);
    if (prof) {
      setSelectedProfile(prof);
      setFilamentSlots(
        prof.filaments.map((f, idx) => ({
          slotIndex: idx,
          originalType: f.type || 'PLA',
          originalColor: f.color || '#3b82f6',
          usedG: f.usedG || 0,
          usedM: f.usedM || 0,
          selectedMaterialId: materials[0]?.id || 'mat-1',
          customColorName: '',
        }))
      );
    }
  };

  // Calculation
  const calculation = React.useMemo(() => {
    if (!selectedProfile || filamentSlots.length === 0) return null;

    const currentPrinter = printers.find((p) => p.id === selectedPrinterId) || printers[0];

    const quoteItems: QuoteItem[] = filamentSlots.map((slot, idx) => ({
      id: `mw-slot-${idx}`,
      name: `${modelData?.title || 'Modelo'} [Slot ${idx + 1} - ${slot.originalType}]`,
      materialId: slot.selectedMaterialId || materials[0]?.id || 'mat-1',
      printerId: currentPrinter?.id || 'printer-1',
      weightGrams: (slot.usedG || 0) * quantity,
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
  const handleSubmitDecision = async () => {
    const decisionKey = selectedDecision === 'imprimir' ? 'direct_print' : 'confirm_quote';

    if (!currentUser.email || !currentUser.phone || currentUser.phone.replace(/\D/g, '').length < 10) {
      setPendingDecision(selectedDecision);
      onRequireAuth();
      return;
    }

    if (!selectedProfile || !modelData || filamentSlots.length === 0 || !calculation) return;

    setIsSubmitting(true);

    try {
      const generatedQuoteNumber = `ORC-${Date.now().toString().slice(-4)}`;
      const quotePayload: Partial<SavedQuote> = {
        quoteNumber: generatedQuoteNumber,
        customerId: currentUser.id || currentUser.googleId || undefined,
        customerName: currentUser.name || 'Cliente BagreLab',
        customerPhone: currentUser.phone,
        customerEmail: currentUser.email,
        customerContact: currentUser.phone,
        date: new Date().toISOString().split('T')[0],
        status: decisionKey === 'direct_print' ? 'approved' : 'pending_review',
        clientDecision: decisionKey,
        quantity,
        paymentStatus: 'pending',
        makerWorldData: {
          designId: modelData.designId,
          modelTitle: modelData.title,
          profileTitle: selectedProfile.title,
          sourceUrl: modelData.sourceUrl,
          coverUrl: modelData.coverUrl,
          filaments: filamentSlots,
        },
        items: filamentSlots.map((slot, idx) => ({
          id: `item-${idx}`,
          name: `${modelData.title} (Slot ${idx + 1} - ${slot.originalType})`,
          materialId: slot.selectedMaterialId,
          printerId: selectedPrinterId || printers[0]?.id || '',
          weightGrams: (slot.usedG || 0) * quantity,
          printDays: idx === 0 ? selectedProfile.printDays * quantity : 0,
          printHours: idx === 0 ? selectedProfile.printHours * quantity : 0,
          printMinutes: idx === 0 ? selectedProfile.printMinutes * quantity : 0,
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
        notes: `Solicitação via Portal MakerWorld (BagreLab).\nQuantidade: ${quantity} unidade(s)\nDecisão: ${
          decisionKey === 'direct_print' ? 'Pode Imprimir!' : 'Confirmar Orçamento Final'
        }`,
        calculation,
      };

      if (onSubmitClientQuote) {
        const saved = await onSubmitClientQuote(quotePayload, decisionKey);
        setSubmittedQuote(saved);
      } else {
        setSubmittedQuote({
          ...quotePayload,
          id: `quote-${Date.now()}`,
          quoteNumber: `ORC-${Date.now().toString().slice(-4)}`,
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

  // Auto-submit quote once user completes authentication modal
  useEffect(() => {
    if (pendingDecision && currentUser.phone && currentUser.phone.replace(/\D/g, '').length >= 10) {
      setPendingDecision(null);
      handleSubmitDecision();
    }
  }, [currentUser, pendingDecision]);

  const handleOpenMakerWhatsApp = () => {
    if (!submittedQuote || !modelData || !calculation) return;

    const decisionText =
      submittedQuote.clientDecision === 'direct_print'
        ? '*PODE IMPRIMIR!* (Aprovação Direta de Produção)'
        : '*CONFIRMAR ORÇAMENTO FINAL* (Revisar Detalhes com o Maker)';

    const msg = `Olá! Acabei de enviar um pedido no *BagreLab* referente ao modelo do MakerWorld:

*Peça:* ${modelData.title}
*Código:* #${submittedQuote.quoteNumber}
*Minha Decisão:* ${decisionText}
*Valor Estimado:* ${formatCurrency(calculation.salePriceCash)}
*Quantidade:* ${quantity} unidade(s)

*Meu Nome:* ${currentUser.name}
*Meu WhatsApp:* ${currentUser.phone}

Podemos prosseguir com o pedido?`;

    const targetPhone = settings.whatsappInstance || '';
    const cleanPhone = targetPhone.replace(/\D/g, '');
    const targetUrl = cleanPhone
      ? `https://api.whatsapp.com/send?phone=55${cleanPhone}&text=${encodeURIComponent(msg)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;

    window.open(targetUrl, '_blank');
  };

  const handleImportToCalculator = () => {
    if (!onImportToCalculator || !modelData || !selectedProfile) return;
    onImportToCalculator({
      modelTitle: modelData.title,
      items: filamentSlots.map((slot, idx) => ({
        id: `mw-slot-${Date.now()}-${idx}`,
        name: `${modelData.title} - Slot ${idx + 1} (${slot.originalType})`,
        materialId: slot.selectedMaterialId,
        printerId: selectedPrinterId || printers[0]?.id || 'kobra-1',
        weightGrams: (slot.usedG || 0) * quantity,
        printDays: idx === 0 ? selectedProfile.printDays * quantity : 0,
        printHours: idx === 0 ? selectedProfile.printHours * quantity : 0,
        printMinutes: idx === 0 ? selectedProfile.printMinutes * quantity : 0,
      })),
      notes: `Importado do MakerWorld: ${modelData.title} (#${modelData.designId})\nPerfil: ${selectedProfile.title}`,
    });
  };

  const currentEstimatedPrice = (calculation?.salePriceCash || 0);

  return (
    <section className="space-y-5">
      
      {/* Barra Compacta de Link do MakerWorld */}
      <div className="paper-card p-3.5 sm:px-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <form onSubmit={handleFetchModel} className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <span className="font-mono-tech text-xs font-bold uppercase tracking-wider text-[#4A4239] whitespace-nowrap">
            LINK MAKERWORLD:
          </span>
          <input
            id="makerworld-url"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Cole o link da peça no MakerWorld (ex: https://makerworld.com/pt/models/...)"
            className="flex-1 bg-[#EFECE4] border border-[#6E6356] rounded px-3 py-1.5 font-mono-tech text-xs sm:text-sm text-[#221E1B] focus:outline-none focus:border-[#1E3E24]"
          />
          <button
            type="submit"
            disabled={isLoading || !url.trim()}
            className="btn-forest px-4 py-1.5 text-xs sm:text-sm font-semibold whitespace-nowrap cursor-pointer disabled:opacity-50"
          >
            {isLoading ? 'Orçando...' : 'Orçar Peça'}
          </button>
        </form>

        <div className="flex items-center justify-end gap-3 border-t md:border-t-0 pt-2 md:pt-0 border-[#D5CBB8]">
          <a
            href="https://makerworld.com/pt"
            target="_blank"
            rel="noreferrer"
            className="btn-paper px-3 py-1.5 text-xs font-mono-tech font-semibold"
          >
            Abrir MakerWorld ↗
          </a>
        </div>
      </div>

      {/* ESTADO VAZIO: TELA ZERADA POR PADRÃO */}
      {!modelData || !selectedProfile ? (
        <div className="paper-card p-8 sm:p-14 text-center border-2 border-dashed border-[#8E8070] my-2">
          <div className="max-w-lg mx-auto space-y-3.5">
            <div className="w-14 h-14 mx-auto rounded-full bg-[#DFD6C5] border-2 border-[#5A4E40] flex items-center justify-center font-mono-tech font-bold text-lg text-[#221E1B] shadow-sm">
              3D
            </div>
            <h2 className="font-heading text-2xl font-bold text-[#221E1B]">
              Bancada de Orçamento Pronta
            </h2>
            <p className="text-sm text-[#5C5349] leading-relaxed">
              Cole acima o link de qualquer modelo do <strong>MakerWorld</strong> e clique em <strong>Orçar Peça</strong> para carregar os pratos, gramas por cor, bico e calcular o valor exato.
            </p>
          </div>
        </div>
      ) : (
        /* ESTADO COM ORÇAMENTO CARREGADO (IDÊNTICO AO ARQUIVO DO USUÁRIO) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* COLUNA ESQUERDA (8 COLUNAS): DADOS DA PEÇA + SELEÇÃO DE FILAMENTOS */}
          <div className="lg:col-span-8 space-y-5">
            
            {/* CARD SUPERIOR: MODELO + 4 CAIXAS DE MÉTRICAS */}
            <div className="paper-card p-5 sm:p-6">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                
                {/* Título e Ilustração do Modelo */}
                <div className="md:col-span-5 flex flex-col items-center md:items-start">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="stamp-badge text-[10px] font-bold px-2 py-0.5 rounded">
                      MAKERWORLD OFICIAL
                    </span>
                    <span className="font-mono-tech text-xs text-[#5C5349]">
                      #{modelData.designId}
                    </span>
                  </div>

                  <h2 className="font-heading text-2xl sm:text-3xl font-bold text-[#221E1B] mb-1">
                    {modelData.title}
                  </h2>

                  <p className="text-xs text-[#5C5349] mb-3">
                    Designer: <strong>{modelData.creatorName}</strong> •{' '}
                    <a
                      href={modelData.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#1E3E24] underline font-medium"
                    >
                      Ver no MakerWorld ↗
                    </a>
                  </p>

                  {/* Ilustração estilo Gravura / Esboço Técnico sobre Papel */}
                  <div className="w-full h-44 bg-[#EFECE4] border border-[#8E8070] rounded flex items-center justify-center p-4 relative overflow-hidden">
                    {modelData.designId === 153547 ? (
                      /* SVG do Sapo exatamente como no arquivo HTML */
                      <svg className="w-36 h-36 drop-shadow select-none" viewBox="0 0 200 170" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <ellipse cx="100" cy="145" rx="62" ry="12" fill="rgba(34,30,27,0.12)" />
                        <path d="M55 125 C40 100, 48 65, 75 55 C90 48, 115 48, 130 55 C155 68, 160 100, 145 125 C130 138, 70 138, 55 125 Z" fill="#C2AB90" stroke="#221E1B" strokeWidth="3" />
                        <circle cx="78" cy="52" r="14" fill="#D5C2AA" stroke="#221E1B" strokeWidth="3" />
                        <circle cx="122" cy="52" r="14" fill="#D5C2AA" stroke="#221E1B" strokeWidth="3" />
                        <circle cx="78" cy="50" r="6" fill="#221E1B" />
                        <circle cx="122" cy="50" r="6" fill="#221E1B" />
                        <path d="M68 118 L52 142 M52 142 L40 140 M52 142 L48 149 M52 142 L60 147" stroke="#221E1B" strokeWidth="3.5" strokeLinecap="round" />
                        <path d="M132 118 L146 142 M146 142 L138 147 M146 142 L152 149 M146 142 L158 140" stroke="#221E1B" strokeWidth="3.5" strokeLinecap="round" />
                        <path d="M52 105 C32 102, 28 122, 44 130 L34 135" fill="#B2997D" stroke="#221E1B" strokeWidth="3" strokeLinecap="round" />
                        <path d="M148 105 C168 102, 172 122, 156 130 L166 135" fill="#B2997D" stroke="#221E1B" strokeWidth="3" strokeLinecap="round" />
                        <path d="M65 85 Q100 95 135 85" stroke="#5A4E40" strokeWidth="1.2" strokeDasharray="3 2" />
                        <path d="M62 102 Q100 112 138 102" stroke="#5A4E40" strokeWidth="1.2" strokeDasharray="3 2" />
                      </svg>
                    ) : (
                      <img
                        src={modelData.coverUrl || '/frog-preview.png'}
                        alt={modelData.title}
                        className="max-h-full max-w-full object-contain drop-shadow"
                      />
                    )}
                    <span className="absolute bottom-1.5 right-2 font-mono-tech text-[10px] text-[#5C5349]">
                      PREVIEW STL // ESCALA 100%
                    </span>
                  </div>
                </div>

                {/* 4 Blocos de Métricas + Seletor de Perfil */}
                <div className="md:col-span-7 space-y-3.5">
                  
                  {/* Seletor de Perfil de Impressão */}
                  <div>
                    <label className="block font-mono-tech text-[11px] font-bold uppercase text-[#5C5349] mb-1">
                      PERFIL DE IMPRESSÃO EXTRAÍDO:
                    </label>
                    <select
                      value={selectedProfile.id}
                      onChange={(e) => handleSelectProfile(Number(e.target.value))}
                      className="w-full bg-[#EFECE4] border-[1.5px] border-[#4A4239] rounded px-3 py-2 text-xs sm:text-sm font-medium text-[#221E1B] focus:outline-none"
                    >
                      {modelData.instances.map((inst) => (
                        <option key={inst.id} value={inst.id}>
                          {inst.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Grid 2x2 de Métricas (Idêntico ao arquivo HTML) */}
                  <div className="grid grid-cols-2 gap-3.5">
                    <div className="metric-box p-4 text-center">
                      <span className="block text-sm text-[#4A4239] font-medium mb-0.5">Mesa/Pratos</span>
                      <strong className="font-heading text-2xl sm:text-3xl font-bold text-[#221E1B]">
                        ({selectedProfile.platesCount} Prato{selectedProfile.platesCount > 1 ? 's' : ''})
                      </strong>
                    </div>

                    <div className="metric-box p-4 text-center">
                      <span className="block text-sm text-[#4A4239] font-medium mb-0.5">Tempo</span>
                      <strong className="font-heading text-2xl sm:text-3xl font-bold text-[#221E1B]">
                        {formatHours(selectedProfile.totalHours * quantity)}
                      </strong>
                    </div>

                    <div className="metric-box p-4 text-center">
                      <span className="block text-sm text-[#4A4239] font-medium mb-0.5">Bico</span>
                      <strong className="font-heading text-2xl sm:text-3xl font-bold text-[#221E1B]">
                        ({selectedProfile.nozzleDiameter} mm)
                      </strong>
                    </div>

                    <div className="metric-box p-4 text-center">
                      <span className="block text-sm text-[#4A4239] font-medium mb-0.5">Peso</span>
                      <strong className="font-heading text-2xl sm:text-3xl font-bold text-[#221E1B]">
                        ({selectedProfile.weightGrams * quantity} g)
                      </strong>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* CARD INFERIOR: SELEÇÃO DE FILAMENTOS (SLOTS REAIS POR COR DO MODELO) */}
            <div className="paper-card p-5 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-3 border-b border-[#6E6356]/30">
                <div>
                  <h3 className="font-heading text-lg sm:text-xl font-bold tracking-tight uppercase text-[#221E1B]">
                    Seleção de Filamentos & Cores
                  </h3>
                  <p className="text-xs sm:text-sm text-[#5C5349] font-mono-tech">
                    {filamentSlots.length} cor(es) necessária(s) no modelo fatiado
                  </p>
                </div>
                <span className="font-mono-tech text-xs font-semibold px-2.5 py-1 bg-[#EFECE4] border border-[#6E6356] rounded">
                  Consumo Total: {selectedProfile.weightGrams * quantity}g (~{(selectedProfile.weightGrams * 0.31 * quantity).toFixed(1)}m)
                </span>
              </div>

              {/* LISTA DE SLOTS REAIS DA PEÇA (SEM FILAMENTOS PRESETADOS FALSOS) */}
              <div className="space-y-3">
                {filamentSlots.map((slot) => {
                  const usedGrams = (slot.usedG || 0) * quantity;
                  const usedMeters = slot.usedM ? slot.usedM * quantity : usedGrams * 0.31;

                  return (
                    <div
                      key={slot.slotIndex}
                      className="bg-[#EFECE4] border border-[#6E6356] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      {/* Left: Cor original da peça no MakerWorld e consumo */}
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded border border-[#6E6356] shadow-inner shrink-0 flex items-center justify-center font-mono-tech font-bold text-xs"
                          style={{
                            backgroundColor: slot.originalColor,
                            color:
                              slot.originalColor === '#000000' || slot.originalColor === '#001489' || slot.originalColor === '#020617'
                                ? '#ffffff'
                                : '#221E1B',
                          }}
                          title={`Cor original no modelo 3D: ${slot.originalColor}`}
                        >
                          #{slot.slotIndex + 1}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-heading font-bold text-xs sm:text-sm text-[#221E1B] uppercase">
                              Slot #{slot.slotIndex + 1}: {slot.originalType}
                            </span>
                            <span className="text-[10px] font-mono-tech text-[#5C5349] bg-[#FAF8F5] px-1.5 py-0.5 border border-[#6E6356]/40">
                              {slot.originalColor}
                            </span>
                          </div>
                          <div className="text-xs font-mono-tech text-[#5C5349] mt-0.5">
                            Consumo: <strong className="text-[#221E1B] font-bold">{usedGrams}g</strong>
                            {usedMeters ? ` (~${usedMeters.toFixed(1)}m)` : ''}
                          </div>
                        </div>
                      </div>

                      {/* Right: Filamento real do estoque cadastrado e observações */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 flex-1 max-w-lg">
                        <div className="flex-1">
                          <label className="text-[10px] font-mono-tech font-bold text-[#5C5349] uppercase block mb-1">
                            Filamento & Cor em Estoque:
                          </label>
                          <select
                            value={slot.selectedMaterialId}
                            onChange={(e) => handleSlotMaterialChange(slot.slotIndex, e.target.value)}
                            className="w-full bg-[#FAF8F5] border border-[#6E6356] px-3 py-1.5 text-xs font-mono-tech font-semibold text-[#221E1B] focus:outline-none focus:border-[#1E3E24]"
                          >
                            {materials.map((m) => {
                              const colorLabel = formatColorLabel(m.color, m.colorName);
                              return (
                                <option key={m.id} value={m.id}>
                                  {m.name} ({m.type}{colorLabel ? ` • ${colorLabel}` : ''})
                                </option>
                              );
                            })}
                          </select>
                        </div>

                        <div className="sm:w-44">
                          <label className="text-[10px] font-mono-tech font-bold text-[#5C5349] uppercase block mb-1">
                            Obs. da Peça:
                          </label>
                          <input
                            type="text"
                            value={slot.customColorName || ''}
                            onChange={(e) => handleSlotNotesChange(slot.slotIndex, e.target.value)}
                            placeholder="Ex: Fosco, Silk..."
                            className="w-full bg-[#FAF8F5] border border-[#6E6356] px-2.5 py-1.5 text-xs font-mono-tech text-[#221E1B] focus:outline-none focus:border-[#1E3E24]"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Maker Workshop Calibration Panel */}
              {isMaker && (
                <div className="pt-3 border-t border-[#D5CBB8] space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-heading font-bold text-[#221E1B] flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-[#1E3E24]" />
                      <span>Ajustes da Oficina (Maker)</span>
                    </span>
                    <span className="font-mono-tech text-[11px] font-bold text-[#1E3E24]">
                      Margem: {profitMargin}%
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-mono-tech text-[10px] text-[#5C5349] uppercase mb-1">
                        Impressora Alocada:
                      </label>
                      <select
                        value={selectedPrinterId}
                        onChange={(e) => setSelectedPrinterId(e.target.value)}
                        className="w-full bg-[#EFECE4] border border-[#6E6356] rounded px-2.5 py-1.5 text-xs text-[#221E1B]"
                      >
                        {printers.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({formatCurrency(p.depreciationPerHour)}/h)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-mono-tech text-[10px] text-[#5C5349] uppercase mb-1">
                        Ajuste de Margem:
                      </label>
                      <input
                        type="range"
                        min="10"
                        max="80"
                        step="5"
                        value={profitMargin}
                        onChange={(e) => setProfitMargin(Number(e.target.value))}
                        className="w-full accent-[#1E3E24] cursor-pointer"
                      />
                    </div>
                  </div>

                  {onImportToCalculator && (
                    <div className="pt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={handleImportToCalculator}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1E3E24] hover:underline cursor-pointer font-mono-tech"
                      >
                        <span>Importar itens para Calculadora Geral</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )}

            </div>

          </div>

          {/* COLUNA DIREITA (4 COLUNAS): CAIXA DE FECHAMENTO EM PAPELÃO KRAFT */}
          <div className="lg:col-span-4 pt-3">
            
            {/* Abas Superiores da Caixa de Papelão */}
            <div className="grid grid-cols-2 px-3 -mb-1">
              <div className="cardboard-flap-left h-4"></div>
              <div className="cardboard-flap-right h-4"></div>
            </div>

            {/* Corpo da Caixa de Fechamento */}
            <div className="cardboard-box p-5 sm:p-6 space-y-4">
              
              {/* Entalhe meia-lua superior de caixa */}
              <div className="w-8 h-3 bg-[#9B8669] border border-[#4A3F33] rounded-b-full mx-auto -mt-5 mb-1"></div>

              <div className="flex items-center justify-between border-b border-[#8F7B60] pb-2">
                <h3 className="font-heading text-lg font-bold tracking-wider uppercase text-[#221E1B]">
                  FECHAMENTO
                </h3>
                
                {/* Controle de Quantidade Compacto */}
                <div className="flex items-center gap-1.5 bg-[#DFD6C5] px-2 py-0.5 rounded border border-[#5A4E40]">
                  <span className="font-mono-tech text-xs text-[#3A3128] mr-1">Qtd:</span>
                  <button
                    type="button"
                    onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                    disabled={quantity <= 1}
                    className="w-6 h-6 bg-[#F6F3EC] border border-[#4A4239] rounded font-bold text-sm leading-none cursor-pointer disabled:opacity-40"
                  >
                    -
                  </button>
                  <span className="font-mono-tech font-bold text-sm px-1.5 text-[#221E1B]">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((prev) => Math.min(100, prev + 1))}
                    className="w-6 h-6 bg-[#F6F3EC] border border-[#4A4239] rounded font-bold text-sm leading-none cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Visor Interno de Preço Estimado */}
              <div className="price-inset p-5 text-center space-y-1">
                <span className="block text-sm font-medium text-[#3A3128]">
                  Preço estimado:
                </span>
                <div className="font-heading text-4xl sm:text-5xl font-bold text-[#1E3E24] tracking-tight">
                  {formatCurrency(currentEstimatedPrice)}
                </div>
                <span className="block font-mono-tech text-[11px] text-[#5C5349] pt-1">
                  À vista / PIX • <span>{selectedProfile.weightGrams * quantity}g no total • ~{selectedProfile.printMinutes * quantity}m</span>
                  {quantity > 1 && ` • ${formatCurrency(currentEstimatedPrice / quantity)}/un.`}
                </span>
              </div>

              {/* Opções de Decisão (Confirmar Orçamento Final vs Pode Imprimir!) */}
              <div className="space-y-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setSelectedDecision('revisao')}
                  className={`btn-paper w-full py-3 px-4 text-left flex items-center justify-between cursor-pointer ${
                    selectedDecision === 'revisao' ? 'selected' : ''
                  }`}
                >
                  <div>
                    <span className="block font-heading font-bold text-sm sm:text-base text-[#221E1B]">
                      Confirmar Orçamento Final
                    </span>
                    <span className="block text-xs text-[#5C5349]">
                      Tirar dúvidas sobre prazos ou cores antes de imprimir
                    </span>
                  </div>
                  <span className="font-mono-tech text-[10px] font-bold px-2 py-0.5 bg-[#D6C3A9] border border-[#5A4E40] rounded">
                    REVISÃO
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedDecision('imprimir')}
                  className={`btn-paper w-full py-3 px-4 text-left flex items-center justify-between cursor-pointer ${
                    selectedDecision === 'imprimir' ? 'selected' : ''
                  }`}
                >
                  <div>
                    <span className="block font-heading font-bold text-sm sm:text-base text-[#221E1B]">
                      Pode Imprimir!
                    </span>
                    <span className="block text-xs text-[#5C5349]">
                      Autorizo entrada imediata na fila de produção
                    </span>
                  </div>
                  <span className="stamp-badge text-[10px] font-bold px-2 py-0.5 rounded">
                    DIRETO
                  </span>
                </button>
              </div>

              {/* Aviso Técnico */}
              <div className="bg-[#E6D7B8] border border-[#8A6D3B] rounded p-2.5 text-[11px] text-[#4A3B22] leading-snug">
                <strong>Nota da Oficina:</strong> O valor pode sofrer pequenos ajustes caso a peça exija suportes complexos na análise técnica.
              </div>

              {/* Botão Principal Verde Floresta */}
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmitDecision}
                className="btn-forest w-full py-3.5 px-4 font-heading font-bold text-base sm:text-lg text-center leading-tight cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Enviando Pedido...' : 'Enviar Solicitação de Orçamento'}
              </button>

            </div>
          </div>

        </div>
      )}

      {/* Success Confirmation Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="paper-card max-w-md w-full p-6 text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 rounded-full bg-[#E3ECE4] border-2 border-[#1E3E24] flex items-center justify-center mx-auto text-[#1E3E24]">
              <Package className="w-7 h-7" />
            </div>

            <div>
              <span className="font-mono-tech text-[10px] font-bold uppercase text-[#5C5349] tracking-widest block">
                Pedido Registrado na Oficina
              </span>
              <h3 className="font-heading text-xl font-bold text-[#221E1B] mt-1">
                Solicitação #{submittedQuote?.quoteNumber}
              </h3>
              <p className="text-xs text-[#5C5349] mt-1.5 leading-relaxed">
                Seu pedido para "{modelData?.title || 'sua peça'}" foi enviado com sucesso para a fila de análise da BagreLab!
              </p>
            </div>

            <div className="price-inset p-3 text-xs space-y-1 text-left font-mono-tech">
              <div className="flex justify-between">
                <span className="text-[#5C5349]">Decisão:</span>
                <strong className="text-[#1E3E24]">
                  {selectedDecision === 'imprimir' ? 'Pode Imprimir!' : 'Confirmar Orçamento Final'}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5C5349]">Valor Estimado:</span>
                <strong className="text-[#221E1B]">
                  {formatCurrency(currentEstimatedPrice)}
                </strong>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                type="button"
                onClick={handleOpenMakerWhatsApp}
                className="btn-forest flex-1 py-2.5 px-4 font-heading font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Avisar no WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowSuccessModal(false);
                  if (onNavigateToMyRequests) onNavigateToMyRequests();
                }}
                className="btn-paper py-2.5 px-4 font-mono-tech text-xs font-bold cursor-pointer"
              >
                Ver Meus Pedidos
              </button>
            </div>
          </div>
        </div>
      )}

    </section>
  );
};
