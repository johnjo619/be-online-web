import { useEffect, useState } from 'react';
import { initMercadoPago, Wallet } from '@mercadopago/sdk-react';

interface MercadoPagoWalletProps {
  publicKey: string;
  preferenceId: string;
}

export default function MercadoPagoWallet({
  publicKey,
  preferenceId,
}: MercadoPagoWalletProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (publicKey) {
      initMercadoPago(publicKey, { locale: 'es-MX' });
      setReady(true);
    }
  }, [publicKey]);

  if (!ready || !preferenceId) {
    return (
      <div className="flex justify-center py-6">
        <div className="w-6 h-6 border-2 border-[#1a1e29] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full">
      <Wallet
        initialization={{ preferenceId, redirectMode: 'modal' }}
        customization={{
          visual: {
            borderRadius: '24px',
            verticalPadding: '12px',
            horizontalPadding: '0px',
          },
          texts: { action: 'pay', valueProp: 'smart_option' },
        }}
      />
    </div>
  );
}
