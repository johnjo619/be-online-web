import { useEffect, useRef, useState } from 'react';
import { getOrderStatus } from '../../lib/api';

/**
 * Polling de estado de orden en /pago-exitoso.
 *
 * Cuando el user vuelve del checkout de MP/Stripe, el webhook que confirma
 * el pago puede tardar 1-5 segundos en llegar al backend. Sin este polling,
 * el cliente ve "¡Compra exitosa!" optimista pero la orden sigue 'created'
 * hasta que el webhook se procesa. Si algo falla, no se entera.
 *
 * Estrategia:
 *  - Poll cada 2 segundos
 *  - Tras N intentos (default 15 = 30s), parar y mostrar mensaje neutral
 *    ("Tu pago se está procesando, te avisamos al correo")
 *  - Estados: created (waiting) → paid / failed / preactivated / shipped
 */

interface Props {
  /** Cuántos intentos antes de rendirse (default 15 = 30s). */
  maxAttempts?: number;
}

type Status = 'loading' | 'pending' | 'paid' | 'failed' | 'timeout' | 'error' | 'noorder';

export default function OrderStatusPoller({ maxAttempts = 15 }: Props) {
  const [status, setStatus] = useState<Status>('loading');
  const [orderUuid, setOrderUuid] = useState<string>('');
  const [orderTotal, setOrderTotal] = useState<number | null>(null);
  const [orderStatus, setOrderStatus] = useState<string>('');
  const attemptsRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // El UUID viene del query string ?order=UUID en /pago-exitoso
    const params = new URLSearchParams(window.location.search);
    const uuid = params.get('order') || '';
    setOrderUuid(uuid);

    if (!uuid) {
      // Fallback: si no hay UUID, mostramos mensaje neutral de "compra recibida".
      // Esto pasa cuando el flow no pasó por OrderStatusPoller (e.g. /activar/
      // del portal cautivo viejo, que aún no manda ?order=).
      setStatus('noorder');
      return;
    }

    let cancelled = false;

    const poll = async () => {
      if (cancelled) return;
      attemptsRef.current += 1;
      try {
        const order = await getOrderStatus(orderUuid);
        if (cancelled) return;
        setOrderTotal(order.total);
        setOrderStatus(order.status);

        // Estados terminales positivos
        if (['paid', 'sim_assigned', 'preactivated', 'shipped', 'delivered'].includes(order.status)) {
          setStatus('paid');
          return;
        }
        // Estados terminales negativos
        if (['failed', 'canceled', 'refund'].includes(order.status)) {
          setStatus('failed');
          return;
        }
        // 'created' (aún esperando webhook) o 'in_process' → seguir polling
        setStatus('pending');
      } catch {
        // Error de red — reintentamos
        if (cancelled) return;
        setStatus('error');
      }

      if (attemptsRef.current < maxAttempts) {
        timerRef.current = setTimeout(poll, 2000);
      } else {
        setStatus((s) => (s === 'paid' || s === 'failed' ? s : 'timeout'));
      }
    };

    poll();
    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [maxAttempts]);

  return (
    <div className="space-y-6">
      {/* Hero según estado */}
      {(status === 'loading' || status === 'pending') && (
        <div>
          <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-6">
            <span className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
          <h1 className="font-unbounded text-3xl font-bold text-panda-dark mb-3">
            Confirmando tu pago...
          </h1>
          <p className="font-poppins text-panda-gray">
            Esto toma unos segundos. No cierres esta ventana.
          </p>
        </div>
      )}

      {status === 'paid' && (
        <div>
          <div className="w-20 h-20 rounded-full bg-panda-green/10 flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-panda-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="font-unbounded text-3xl font-bold text-panda-dark mb-3">
            ¡Pago confirmado!
          </h1>
          <p className="font-poppins text-panda-gray mb-2">
            Te enviamos un correo con los detalles. Si es eSIM, también recibirás el QR.
          </p>
          <p className="font-poppins text-xs text-panda-gray italic">
            Si no llega en 5 minutos, revisa tu spam o contáctanos a *777.
          </p>
        </div>
      )}

      {status === 'failed' && (
        <div>
          <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-panda-red" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="font-unbounded text-3xl font-bold text-panda-dark mb-3">
            Hubo un problema
          </h1>
          <p className="font-poppins text-panda-gray mb-2">
            Tu pago no se pudo procesar (estado: {orderStatus}).
          </p>
          <p className="font-poppins text-sm text-panda-gray">
            Si crees que es un error, contáctanos a *777 con tu número de orden.
          </p>
        </div>
      )}

      {status === 'timeout' && (
        <div>
          <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="font-unbounded text-3xl font-bold text-panda-dark mb-3">
            Tu pago se está procesando
          </h1>
          <p className="font-poppins text-panda-gray mb-2">
            Está tardando un poco más de lo normal. Te enviaremos un correo en cuanto se confirme.
          </p>
          <p className="font-poppins text-xs text-panda-gray italic">
            No es necesario que te quedes aquí. Tu orden está segura.
          </p>
        </div>
      )}

      {status === 'error' && (
        <div>
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-panda-gray" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="font-unbounded text-3xl font-bold text-panda-dark mb-3">
            No pudimos verificar tu orden
          </h1>
          <p className="font-poppins text-panda-gray">
            Pero no te preocupes — tu pago está seguro. Si pagaste, recibirás un correo de confirmación. Si no, llámanos a *777.
          </p>
        </div>
      )}

      {status === 'noorder' && (
        <div>
          <div className="w-20 h-20 rounded-full bg-panda-green/10 flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-panda-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="font-unbounded text-3xl font-bold text-panda-dark mb-3">
            ¡Compra recibida!
          </h1>
          <p className="font-poppins text-panda-gray mb-1">
            Te enviaremos un correo con los detalles. Si es eSIM, también recibirás el QR.
          </p>
          <p className="font-poppins text-xs text-panda-gray italic">
            Revisa tu bandeja de entrada (y spam).
          </p>
        </div>
      )}

      {/* Detalle de orden (solo si tenemos UUID) */}
      {orderUuid && (
        <div className="bg-white rounded-2xl p-5 text-sm font-poppins border border-gray-100">
          <p className="text-[10px] font-bold text-panda-gray uppercase tracking-wider mb-3">Resumen</p>
          <div className="flex justify-between mb-2">
            <span className="text-panda-gray">Orden</span>
            <span className="text-panda-dark font-semibold tabular-nums">#{orderUuid.slice(0, 8).toUpperCase()}</span>
          </div>
          {orderTotal !== null && (
            <div className="flex justify-between mb-2">
              <span className="text-panda-gray">Total</span>
              <span className="text-panda-dark font-semibold tabular-nums">${orderTotal.toFixed(2)} MXN</span>
            </div>
          )}
          {orderStatus && (
            <div className="flex justify-between">
              <span className="text-panda-gray">Estado</span>
              <span className={`font-semibold capitalize ${
                ['paid','sim_assigned','preactivated','shipped','delivered'].includes(orderStatus) ? 'text-panda-green' :
                ['failed','canceled','refund'].includes(orderStatus) ? 'text-panda-red' :
                'text-amber-600'
              }`}>{orderStatus}</span>
            </div>
          )}
        </div>
      )}

      <a
        href="/"
        className="inline-flex items-center px-8 py-4 rounded-full bg-panda-red text-white font-bold shadow-lg shadow-panda-red/30 hover:bg-panda-red-dark transition-colors"
      >
        Volver al inicio →
      </a>
    </div>
  );
}
