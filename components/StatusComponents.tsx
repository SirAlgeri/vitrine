import React from 'react';
import { Clock, Package, Truck, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { 
  PaymentStatus, 
  OrderStatus, 
  PAYMENT_STATUS_LABELS, 
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_COLORS,
  ORDER_STATUS_COLORS
} from '../shared/constants/status';

interface StatusBadgeProps {
  status: PaymentStatus | OrderStatus;
  type: 'payment' | 'order';
}

export function StatusBadge({ status, type }: StatusBadgeProps) {
  const labels = type === 'payment' ? PAYMENT_STATUS_LABELS : ORDER_STATUS_LABELS;
  const colors = type === 'payment' ? PAYMENT_STATUS_COLORS : ORDER_STATUS_COLORS;
  
  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${colors[status]}`}>
      {labels[status]}
    </span>
  );
}

interface OrderTimelineProps {
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
}

export function OrderTimeline({ orderStatus, paymentStatus }: OrderTimelineProps) {
  const steps = [
    { status: OrderStatus.PENDING_PAYMENT, label: 'Aguardando pagamento', icon: Clock },
    { status: OrderStatus.PAID, label: 'Pago', icon: CheckCircle },
    { status: OrderStatus.PREPARING, label: 'Preparando envio', icon: Package },
    { status: OrderStatus.SHIPPED, label: 'Enviado', icon: Truck },
    { status: OrderStatus.DELIVERED, label: 'Concluído', icon: CheckCircle }
  ];
  
  const currentIndex = steps.findIndex(s => s.status === orderStatus);
  const isCanceled = orderStatus === OrderStatus.CANCELED || orderStatus === OrderStatus.REFUNDED;
  
  if (isCanceled) {
    const Icon = orderStatus === OrderStatus.REFUNDED ? RefreshCw : XCircle;
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
        <div className="flex items-center gap-3 text-red-300">
          <Icon className="w-6 h-6" />
          <div>
            <div className="font-medium">{ORDER_STATUS_LABELS[orderStatus]}</div>
            <div className="text-sm text-slate-400">
              {orderStatus === OrderStatus.REFUNDED ? 'Pagamento estornado' : 'Pedido cancelado'}
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {steps.map((step, index) => {
        const isActive = index === currentIndex;
        const isCompleted = index < currentIndex;
        const isPending = index > currentIndex;
        const Icon = step.icon;
        
        return (
          <div key={step.status} className="flex items-start gap-4">
            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
              ${isActive ? 'bg-blue-500/20 ring-2 ring-blue-500' : ''}
              ${isCompleted ? 'bg-green-500/20' : ''}
              ${isPending ? 'bg-slate-700' : ''}
            `}>
              <Icon className={`w-5 h-5 ${isActive ? 'text-blue-300' : isCompleted ? 'text-green-300' : 'text-slate-500'}`} />
            </div>
            <div className="flex-1">
              <div className={`font-medium ${isActive ? 'text-blue-300' : isPending ? 'text-slate-500' : 'text-slate-300'}`}>
                {step.label}
              </div>
              {isActive && paymentStatus === PaymentStatus.PENDING && index === 0 && (
                <div className="text-sm text-slate-400 mt-1">
                  Aguardando confirmação do pagamento
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
