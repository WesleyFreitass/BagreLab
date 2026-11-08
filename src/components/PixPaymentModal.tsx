import React, { useState, useEffect, useRef } from 'react';
import { SavedQuote, PixPaymentData } from '../lib/types';
import { formatCurrency } from '../lib/calculator';
import { createPixPaymentApi, checkPixPaymentStatusApi } from '../lib/api';
import {
  X,
  QrCode,
  Copy,
  Check,
  CheckCircle2,
  Clock,
  ExternalLink,
  AlertCircle,
  MessageSquare,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface PixPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  quote: SavedQuote | null;
  onPaymentSuccess?: (quoteId: string) => void;
}

export const PixPaymentModal: React.FC<PixPaymentModalProps> = ({
  isOpen,
  onClose,
  quote,
  onPaymentSuccess,
}) => {
  const [pixData, setPixData] = useState<PixPaymentData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [missingConfig, setMissingConfig] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const quoteId = quote?.id || quote?._id;
  const finalVal =
    quote?.calculation?.finalPriceWithShipping || quote?.calculation?.salePriceCash || 0;

  // Carregar ou gerar o Pix quando o modal abrir
  useEffect(() => {
    if (!isOpen || !quoteId || !quote) {
      setPixData(null);
      setIsApproved(false);
      setErrorMessage(null);
      setMissingConfig(false);
      if (pollingRef.current) clearInterval(pollingRef.current);
      return;
    }

    if (quote.paymentStatus === 'paid') {
      setIsApproved(true);
      return;
    }

    // Se o pedido já possui um Pix válido salvo
    if (quote.pixPayment?.qrCodeBase64 && quote.pixPayment.status !== 'approved') {
      setPixData(quote.pixPayment);
    } else {
      generatePix();
    }
  }, [isOpen, quoteId]);

  const generatePix = async () => {
    if (!quoteId) return;
    setIsLoading(true);
    setErrorMessage(null);
    setMissingConfig(false);

    try {
      const res = await createPixPaymentApi(quoteId);
      if (res.success && res.pix) {
        setPixData(res.pix);
      } else {
        setErrorMessage(res.error || 'Não foi possível gerar o QR Code Pix.');
        if (res.missingConfig) {
          setMissingConfig(true);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro de comunicação ao gerar Pix.');
    } finally {
      setIsLoading(false);
    }
  };

  // Polling automático para detectar baixa instantânea do Pix
  useEffect(() => {
    if (!isOpen || !quoteId || isApproved) {
      if (pollingRef.current) clearInterval(pollingRef.current);
      return;
    }

    const poll = async () => {
      try {
        const res = await checkPixPaymentStatusApi(quoteId);
        if (res.paid || res.approvedNow) {
          setIsApproved(true);
          if (pollingRef.current) clearInterval(pollingRef.current);
          if (onPaymentSuccess) {
            onPaymentSuccess(quoteId);
          }
          // Fecha modal automaticamente após celebração
          setTimeout(() => {
            onClose();
          }, 3200);
        }
      } catch (e) {
        // ignora erros pontuais de polling
      }
    };

    pollingRef.current = setInterval(poll, 3500);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [isOpen, quoteId, isApproved]);

  const handleCopyCode = async () => {
    if (!pixData?.qrCode) return;
    try {
      await navigator.clipboard.writeText(pixData.qrCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Falha ao copiar:', err);
    }
  };

  const handleOpenWhatsAppManual = () => {
    if (!quote) return;
    const msg = `Olá! Gostaria de realizar o pagamento do pedido #${quote.quoteNumber} (${
      quote.makerWorldData?.modelTitle || 'Impressão 3D'
    }) no valor de ${formatCurrency(finalVal)}. Poderia me enviar a chave Pix?`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
  };

  if (!isOpen || !quote) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-900 via-[#1E3E24] to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base leading-tight">
                Pagamento Instantâneo via Pix
              </h3>
              <span className="text-[11px] text-emerald-200/80 font-mono">
                Pedido #{quote.quoteNumber}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          
          {/* Sucesso / Aprovado */}
          {isApproved ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-xl font-bold text-emerald-950">
                Pagamento Confirmado! 🎉
              </h4>
              <p className="text-xs text-slate-600 max-w-xs mx-auto">
                Identificamos seu Pix no Mercado Pago com sucesso. Seu pedido foi liberado e entrou na <strong>Fila de Impressão</strong> da bancada!
              </p>
              <div className="pt-2 font-mono text-xs font-bold text-emerald-800 bg-emerald-50 py-1.5 px-3 rounded-lg inline-block border border-emerald-200">
                Valor Pago: {formatCurrency(finalVal)}
              </div>
            </div>
          ) : isLoading ? (
            /* Loading State */
            <div className="py-12 text-center space-y-3">
              <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-semibold text-slate-700">
                Gerando QR Code Pix dinâmico no Mercado Pago...
              </p>
              <span className="text-[11px] text-slate-400">
                Isso leva apenas 1 segundo.
              </span>
            </div>
          ) : errorMessage ? (
            /* Error or Missing Config State */
            <div className="py-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 mx-auto flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">
                {missingConfig ? 'Credencial Mercado Pago Pendente' : 'Aviso no Pagamento'}
              </h4>
              <p className="text-xs text-slate-600 max-w-sm mx-auto">
                {missingConfig
                  ? 'A oficina ainda não conectou o Token do Mercado Pago nas Configurações. Fale diretamente com o Maker pelo WhatsApp para combinar o pagamento!'
                  : errorMessage}
              </p>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleOpenWhatsAppManual}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Combinar Pagamento no WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={generatePix}
                  className="w-full py-2 px-4 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Tentar Novamente
                </button>
              </div>
            </div>
          ) : pixData ? (
            /* Active Pix QR Code & Copy Code */
            <div className="space-y-4">
              
              {/* Valor em Destaque */}
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 font-mono block">
                  Total a Pagar via Pix:
                </span>
                <div className="text-2xl font-black font-mono text-emerald-950 mt-0.5">
                  {formatCurrency(finalVal)}
                </div>
                <span className="text-[11px] text-emerald-700 flex items-center justify-center gap-1 mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Crédito imediato na conta da oficina</span>
                </span>
              </div>

              {/* Imagem do QR Code */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center">
                {pixData.qrCodeBase64 ? (
                  <img
                    src={`data:image/png;base64,${pixData.qrCodeBase64}`}
                    alt="QR Code Pix Mercado Pago"
                    className="w-52 h-52 object-contain rounded-lg border border-slate-300 bg-white p-2 shadow-xs"
                  />
                ) : (
                  <div className="w-48 h-48 rounded-lg bg-slate-200 flex items-center justify-center text-slate-400">
                    <QrCode className="w-12 h-12" />
                  </div>
                )}
                <span className="text-[11px] text-slate-500 mt-2 text-center">
                  Abra o app do seu banco e aponte a câmera para escanear o QR Code acima.
                </span>
              </div>

              {/* Pix Copia e Cola */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 block uppercase font-mono tracking-wider">
                  Ou pague pelo Pix Copia e Cola:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    readOnly
                    value={pixData.qrCode || ''}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 pl-3 pr-24 font-mono text-[11px] text-slate-700 focus:outline-none select-all"
                  />
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className={`absolute right-1 top-1 bottom-1 px-3 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      copied
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-900 text-white hover:bg-slate-800'
                    }`}
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copiado!' : 'Copiar'}</span>
                  </button>
                </div>
              </div>

              {/* Status do Polling em Tempo Real */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                <span className="flex items-center gap-1.5 text-amber-700 font-medium">
                  <Clock className="w-3.5 h-3.5 animate-pulse" />
                  <span>Aguardando pagamento...</span>
                </span>

                {pixData.ticketUrl && (
                  <a
                    href={pixData.ticketUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline inline-flex items-center gap-1"
                  >
                    <span>Comprovante MP</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
