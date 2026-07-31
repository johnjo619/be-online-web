interface SuccessStepProps {
  flow: string;
  planName?: string;
}

const MESSAGES: Record<string, { title: string; desc: string }> = {
  activar: {
    title: '¡Línea activada!',
    desc: 'Tu línea Be Online está lista para navegar.',
  },
  recargar: {
    title: '¡Recarga exitosa!',
    desc: 'Tu saldo ha sido actualizado correctamente.',
  },
  portar: {
    title: '¡Portabilidad en proceso!',
    desc: 'Recibirás una notificación cuando tu número esté listo.',
  },
  cambiar_nir: {
    title: '¡Región actualizada!',
    desc: 'Tu lada ha sido cambiada exitosamente.',
  },
};

export default function SuccessStep({ flow, planName }: SuccessStepProps) {
  const msg = MESSAGES[flow] || MESSAGES.activar;

  return (
    <div className="max-w-md mx-auto text-center">
      {/* Success Icon */}
      <div className="w-20 h-20 rounded-full bg-[#04AA6D]/10 flex items-center justify-center mx-auto mb-6">
        <svg className="w-10 h-10 text-[#04AA6D]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h3 className="font-unbounded text-2xl font-bold text-[#0f172a] mb-2">
        {msg.title}
      </h3>
      <p className="font-poppins text-[#7a7a7a] mb-4">{msg.desc}</p>

      {planName && (
        <p className="font-poppins text-sm text-[#0f172a] bg-[#f8fafc] rounded-xl py-3 px-4 inline-block mb-6">
          Plan: <span className="font-semibold">{planName}</span>
        </p>
      )}

      <div>
        <a
          href="/"
          className="inline-flex items-center px-8 py-4 rounded-full bg-[#1a1e29] text-white font-bold shadow-lg shadow-[#1a1e29]/30 hover:bg-[#2a3040] transition-colors"
        >
          Volver al inicio →
        </a>
      </div>
    </div>
  );
}
