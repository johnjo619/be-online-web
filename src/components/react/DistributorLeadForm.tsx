import { useEffect, useState } from 'react';
import { createDistributorLead } from '../../lib/api';
import type { DistributorLeadPayload, PreferredContact } from '../../lib/types';

/**
 * Form de captura de leads de distribuidor. Validation client-side mínima
 * (nombre + teléfono), el resto opcional. Captura UTM params del URL para
 * tracking de campañas. Honeypot oculto "website" descarta bots.
 */

const ESTADOS_MX = [
  'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'Chiapas',
  'Chihuahua', 'Ciudad de México', 'Coahuila', 'Colima', 'Durango', 'Estado de México',
  'Guanajuato', 'Guerrero', 'Hidalgo', 'Jalisco', 'Michoacán', 'Morelos', 'Nayarit',
  'Nuevo León', 'Oaxaca', 'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí',
  'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas',
];

const VOLUME_BUCKETS = [
  { value: '<50', label: 'Menos de 50 SIMs/mes' },
  { value: '50-200', label: 'Entre 50 y 200 SIMs/mes' },
  { value: '200-1000', label: 'Entre 200 y 1,000 SIMs/mes' },
  { value: '1000+', label: 'Más de 1,000 SIMs/mes' },
];

export default function DistributorLeadForm() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [volume, setVolume] = useState('');
  const [contact, setContact] = useState<PreferredContact>('whatsapp');
  const [message, setMessage] = useState('');
  const [website, setWebsite] = useState(''); // honeypot — debe quedar vacío

  const [utm, setUtm] = useState<{ source?: string; medium?: string; campaign?: string }>({});

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  // Captura UTM params al montar
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const p = new URLSearchParams(window.location.search);
    setUtm({
      source: p.get('utm_source') || undefined,
      medium: p.get('utm_medium') || undefined,
      campaign: p.get('utm_campaign') || undefined,
    });
  }, []);

  const phoneIsValid = /^[+]?[\d\s\-()]{8,20}$/.test(phone.trim());
  const emailIsValid = !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const canSubmit = name.trim().length >= 2 && phoneIsValid && emailIsValid && !submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setErrorMsg('');

    const payload: DistributorLeadPayload = {
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      city: city.trim() || undefined,
      state: state || undefined,
      estimated_sales_volume: volume || undefined,
      preferred_contact: contact,
      message: message.trim() || undefined,
      utm_source: utm.source,
      utm_medium: utm.medium,
      utm_campaign: utm.campaign,
      website, // honeypot
    };

    try {
      await createDistributorLead(payload);
      setSuccess(true);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'No pudimos registrar tu solicitud. Intenta de nuevo o llámanos a *777.');
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="bg-gradient-to-br from-panda-green/10 to-emerald-50 border-2 border-panda-green/30 rounded-3xl p-8 sm:p-10 text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-panda-green flex items-center justify-center mb-5 shadow-lg shadow-panda-green/30">
          <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="font-unbounded text-2xl font-bold text-panda-dark mb-3">¡Solicitud recibida!</h3>
        <p className="font-poppins text-panda-gray max-w-md mx-auto leading-relaxed mb-6">
          Nuestro equipo de ventas te contactará por <strong className="text-panda-dark">{contact === 'whatsapp' ? 'WhatsApp' : contact === 'call' ? 'llamada' : 'email'}</strong> en menos de 24 horas hábiles.
        </p>
        <p className="font-poppins text-xs text-panda-gray">¿Tienes prisa? Llámanos directo a <a href="tel:*777" className="text-panda-red font-semibold hover:underline">*777</a></p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 sm:p-8 space-y-5" noValidate>
      <div>
        <h3 className="font-unbounded text-2xl font-bold text-panda-dark">Solicita tu pack</h3>
        <p className="font-poppins text-sm text-panda-gray mt-1">Te contactamos en menos de 24h hábiles.</p>
      </div>

      {/* Honeypot — invisible para humanos, los bots lo llenan */}
      <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', height: 0, overflow: 'hidden' }}>
        <label>
          ¿Sitio web?
          <input type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
        </label>
      </div>

      <Field label="Nombre completo *">
        <input
          type="text"
          required
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-transparent outline-none font-poppins text-panda-dark placeholder:text-gray-300"
          placeholder="Ej. Juan Pérez"
        />
      </Field>

      <Field label="Teléfono / WhatsApp *" hint="Para que te contactemos. 10 dígitos sin lada de país.">
        <input
          type="tel"
          required
          inputMode="numeric"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full bg-transparent outline-none font-poppins text-panda-dark placeholder:text-gray-300"
          placeholder="4424401925"
        />
      </Field>

      <Field label="Email (opcional)">
        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-transparent outline-none font-poppins text-panda-dark placeholder:text-gray-300"
          placeholder="tu@email.com"
        />
      </Field>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Ciudad">
          <input
            type="text"
            autoComplete="address-level2"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full bg-transparent outline-none font-poppins text-panda-dark placeholder:text-gray-300"
            placeholder="Querétaro"
          />
        </Field>
        <Field label="Estado">
          <select
            value={state}
            onChange={(e) => setState(e.target.value)}
            className="w-full bg-transparent outline-none font-poppins text-panda-dark"
          >
            <option value="">Selecciona...</option>
            {ESTADOS_MX.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
      </div>

      <Field label="¿Cuántas SIMs estimas vender al mes?">
        <select
          value={volume}
          onChange={(e) => setVolume(e.target.value)}
          className="w-full bg-transparent outline-none font-poppins text-panda-dark"
        >
          <option value="">Aún no lo sé / Por definir</option>
          {VOLUME_BUCKETS.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
        </select>
      </Field>

      <div>
        <p className="font-poppins text-[11px] font-semibold text-panda-gray uppercase tracking-wider mb-2 px-1">¿Cómo prefieres que te contactemos?</p>
        <div className="grid grid-cols-3 gap-2">
          {(['whatsapp', 'call', 'email'] as PreferredContact[]).map((opt) => (
            <button
              type="button"
              key={opt}
              onClick={() => setContact(opt)}
              className={`min-h-[48px] py-3 px-2 rounded-xl border-2 font-poppins text-sm font-semibold transition-colors ${contact === opt
                  ? 'border-panda-red bg-panda-red/5 text-panda-red'
                  : 'border-gray-200 text-panda-gray hover:border-gray-300'
                }`}
            >
              {opt === 'whatsapp' && 'WhatsApp'}
              {opt === 'call' && 'Llamada'}
              {opt === 'email' && 'Email'}
            </button>
          ))}
        </div>
      </div>

      <Field label="Mensaje (opcional)">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          maxLength={1000}
          className="w-full bg-transparent outline-none font-poppins text-panda-dark placeholder:text-gray-300 resize-y"
          placeholder="¿Algo que quieras contarnos? (opcional)"
        />
      </Field>

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm font-poppins flex items-start gap-2">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{errorMsg}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-panda-red to-panda-red-dark text-white font-bold text-lg shadow-lg shadow-panda-red/30 hover:shadow-xl hover:shadow-panda-red/40 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
      >
        {submitting ? (
          <>
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Enviando...
          </>
        ) : (
          <>
            Enviar solicitud
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </>
        )}
      </button>

      <p className="text-[11px] text-panda-gray text-center font-poppins">
        Al enviar aceptas que Be Online te contacte. No compartimos tus datos con terceros.
      </p>
    </form>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="font-poppins text-[11px] font-semibold text-panda-gray uppercase tracking-wider mb-1.5 px-1">{label}</div>
      <div className="flex items-center gap-3 px-3.5 py-3.5 min-h-[48px] rounded-xl border border-gray-200 bg-white transition-all focus-within:border-panda-red focus-within:ring-2 focus-within:ring-panda-red/20">
        {children}
      </div>
      {hint && <p className="text-panda-gray text-xs mt-1 px-1">{hint}</p>}
    </label>
  );
}
