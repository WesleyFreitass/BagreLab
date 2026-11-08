import { SavedQuote } from './types';

export type PipelineStageKey =
  | 'pending_review' // 1. Novas Solicitações (Análise / Fatiador)
  | 'awaiting_payment' // 2. Aguardando Pagamento (Pix / QR Code)
  | 'queued' // 3. Fila de Impressão (Pago / Pronto)
  | 'in_production' // 4. Em Produção (Na Máquina)
  | 'completed' // 5. Concluídos (Pronto / Entregue)
  | 'cancelled';

export interface PipelineStageConfig {
  key: PipelineStageKey;
  stepNumber: number;
  label: string;
  shortLabel: string;
  description: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
}

export const PIPELINE_STAGES: Record<PipelineStageKey, PipelineStageConfig> = {
  pending_review: {
    key: 'pending_review',
    stepNumber: 1,
    label: 'Novas Solicitações',
    shortLabel: 'Análise Técnica',
    description: 'Aguardando conferência de fatiamento e envio da proposta',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-900',
    badgeBorder: 'border-blue-300',
  },
  awaiting_payment: {
    key: 'awaiting_payment',
    stepNumber: 2,
    label: 'Aguardando Pagamento',
    shortLabel: 'Aguardando Pix',
    description: 'Orçamento definido. Aguardando pagamento do cliente',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-900',
    badgeBorder: 'border-amber-300',
  },
  queued: {
    key: 'queued',
    stepNumber: 3,
    label: 'Fila de Impressão',
    shortLabel: 'Na Fila (Pago)',
    description: 'Pagamento confirmado! Peça na bancada pronta para imprimir',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-900',
    badgeBorder: 'border-emerald-300',
  },
  in_production: {
    key: 'in_production',
    stepNumber: 4,
    label: 'Em Produção',
    shortLabel: 'Imprimindo',
    description: 'Peça atualmente sendo impressa na impressora 3D',
    badgeBg: 'bg-[#1E3E24]',
    badgeText: 'text-[#F6F3EC]',
    badgeBorder: 'border-[#152D19]',
  },
  completed: {
    key: 'completed',
    stepNumber: 5,
    label: 'Concluídos',
    shortLabel: 'Finalizado',
    description: 'Impressão finalizada e peça entregue ao cliente',
    badgeBg: 'bg-[#EFECE4]',
    badgeText: 'text-[#3D352E]',
    badgeBorder: 'border-[#8E8070]',
  },
  cancelled: {
    key: 'cancelled',
    stepNumber: 0,
    label: 'Cancelados',
    shortLabel: 'Cancelado',
    description: 'Pedido cancelado',
    badgeBg: 'bg-rose-50',
    badgeText: 'text-rose-800',
    badgeBorder: 'border-rose-200',
  },
};

export function getQuoteStage(q: SavedQuote): PipelineStageKey {
  if (q.status === 'cancelled') return 'cancelled';
  if (q.status === 'completed') return 'completed';
  if (q.status === 'in_production') return 'in_production';

  // Se já foi pago, está liberado na Fila de Impressão
  if (q.paymentStatus === 'paid' || q.status === 'queued') {
    return 'queued';
  }

  // Se já foi revisado pelo Maker ou marcado como aguardando pagamento
  if (q.status === 'awaiting_payment' || q.isRevised || q.status === 'approved') {
    return 'awaiting_payment';
  }

  // Novo pedido que acabou de chegar
  return 'pending_review';
}
