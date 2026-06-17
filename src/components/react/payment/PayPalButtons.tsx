import { PayPalScriptProvider, PayPalButtons as PPButtons } from '@paypal/react-paypal-js';

interface PayPalButtonsProps {
  clientId: string;
  createOrderFn: () => Promise<string>;
  onApproveFn: (orderID: string) => Promise<void>;
  onError?: (err: unknown) => void;
}

export default function PayPalButtons({
  clientId,
  createOrderFn,
  onApproveFn,
  onError,
}: PayPalButtonsProps) {
  if (!clientId) {
    return <p className="text-red-500 text-sm text-center">PayPal no disponible.</p>;
  }

  return (
    <PayPalScriptProvider
      options={{
        clientId,
        currency: 'MXN',
        intent: 'capture',
      }}
    >
      <PPButtons
        style={{
          layout: 'vertical',
          color: 'blue',
          shape: 'pill',
          label: 'pay',
          height: 48,
        }}
        createOrder={async () => {
          return createOrderFn();
        }}
        onApprove={async (data) => {
          await onApproveFn(data.orderID);
        }}
        onError={(err) => {
          console.error('PayPal error:', err);
          onError?.(err);
        }}
      />
    </PayPalScriptProvider>
  );
}
