import { useState, useEffect, useRef } from 'react';
import type { SimType, ShippingAddress } from '../../lib/types';

/** 32 estados de México — orden alfabético, con CDMX (no "Distrito Federal"). */
const MX_STATES = [
  'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche',
  'Chiapas', 'Chihuahua', 'Ciudad de México', 'Coahuila', 'Colima', 'Durango',
  'Estado de México', 'Guanajuato', 'Guerrero', 'Hidalgo', 'Jalisco',
  'Michoacán', 'Morelos', 'Nayarit', 'Nuevo León', 'Oaxaca', 'Puebla',
  'Querétaro', 'Quintana Roo', 'San Luis Potosí', 'Sinaloa', 'Sonora',
  'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas',
];

/**
 * Asentamiento del catálogo SEPOMEX (vía sepomex.nitrostudio.com.mx).
 * Cada CP puede tener N asentamientos (colonias, fraccionamientos, zonas, etc.).
 */
interface Asentamiento {
  name: string;     // d_asenta — "Parque Tecnológico Innovación Querétaro"
  type: string;     // d_tipo_asenta — "Fraccionamiento", "Colonia", "Zona industrial"
}

interface CpInfo {
  state: string;          // d_estado normalizado: "Querétaro", "Ciudad de México"
  city: string;           // d_ciudad o d_mnpio si ciudad está vacío
  municipio: string;      // d_mnpio: "El Marqués"
  places: Asentamiento[]; // todos los asentamientos del CP
}

/**
 * Fetch CP en SEPOMEX Static API (sepomex.nitrostudio.com.mx).
 * - Datos oficiales SEPOMEX 145k+ registros
 * - Sin token, sin auth
 * - Update mensual desde el archivo oficial
 * - Devuelve estado YA en formato moderno ("Querétaro", "Ciudad de México")
 *
 * Fail-silent: si timeout/error → null y el form cae a captura manual.
 */
async function lookupCp(cp: string): Promise<CpInfo | null> {
  try {
    // Vía proxy del dev server (Vite) o nginx (prod) — la API no tiene CORS.
    const r = await fetch(`/sepomex-proxy/api/latest/cp/${cp}.json`);
    if (!r.ok) return null;
    const json = await r.json();
    const list: Array<{
      d_asenta: string; d_tipo_asenta: string;
      d_mnpio: string; d_estado: string; d_ciudad: string;
    }> = json?.data?.postcodes || [];
    if (list.length === 0) return null;

    const first = list[0];
    const state = (first.d_estado || '').trim();
    const municipio = (first.d_mnpio || '').trim();
    const city = (first.d_ciudad || '').trim() || municipio;

    // Dedupe por nombre (mismo asentamiento puede aparecer 2x si hay diferencia menor)
    const seen = new Set<string>();
    const places: Asentamiento[] = [];
    for (const r of list) {
      const name = (r.d_asenta || '').trim();
      if (!name || seen.has(name.toLowerCase())) continue;
      seen.add(name.toLowerCase());
      places.push({ name, type: (r.d_tipo_asenta || '').trim() });
    }

    return { state, city, municipio, places };
  } catch {
    return null;
  }
}

interface CustomerFormProps {
  simType: SimType;
  onSubmit: (data: CustomerData) => void;
  loading?: boolean;
  /** Si true, oculta el SectionHeader "Tus datos" — el padre lo renderiza. */
  hideMainHeader?: boolean;
}

export interface CustomerData {
  name: string;
  email: string;
  phone: string;
  shipping?: ShippingAddress;
}

export default function CustomerForm({ simType, onSubmit, loading, hideMainHeader = false }: CustomerFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [phone, setPhone] = useState('');
  const [street, setStreet] = useState('');
  const [colony, setColony] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // CP autocompletar: cuando el usuario escribe un CP válido (5 dígitos)
  // disparamos zippopotam.us → llena estado + sugiere colonias.
  const [cpInfo, setCpInfo] = useState<CpInfo | null>(null);
  const [cpLoading, setCpLoading] = useState(false);

  useEffect(() => {
    setErrors((prev) => {
      const { street, colony, zipCode, city, state: s, ...rest } = prev;
      return simType === 'esim' ? rest : prev;
    });
  }, [simType]);

  // Auto-lookup CP — debounced ligero. Se dispara cuando hay 5 dígitos válidos.
  useEffect(() => {
    if (!/^\d{5}$/.test(zipCode)) {
      setCpInfo(null);
      return;
    }
    let cancelled = false;
    setCpLoading(true);
    lookupCp(zipCode).then((info) => {
      if (cancelled) return;
      setCpLoading(false);
      if (info) {
        setCpInfo(info);
        // Auto-llenar estado si no está seteado o no coincide con la lista oficial
        if (info.state && (!state || !MX_STATES.includes(state))) {
          setState(info.state);
        }
        // Auto-llenar ciudad/municipio si está vacío
        if (info.city && !city) {
          setCity(info.city);
        }
        // NO auto-llenar colonia — el user debe elegir explícitamente
      } else {
        setCpInfo(null);
      }
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zipCode]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Nombre requerido';
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errs.email = 'Correo válido requerido';
    if (!phone.trim() || !/^\d{10}$/.test(phone.replace(/\D/g, '')))
      errs.phone = 'Teléfono de 10 dígitos';

    if (simType === 'sim') {
      if (!street.trim()) errs.street = 'Calle requerida';
      if (!colony.trim()) errs.colony = 'Colonia requerida';
      if (!zipCode.trim() || !/^\d{5}$/.test(zipCode)) errs.zipCode = 'CP de 5 dígitos';
      if (!city.trim()) errs.city = 'Ciudad requerida';
      if (!state.trim()) errs.state = 'Estado requerido';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const data: CustomerData = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.replace(/\D/g, ''),
    };

    if (simType === 'sim') {
      data.shipping = {
        street: street.trim(),
        colony: colony.trim(),
        zip_code: zipCode.trim(),
        city: city.trim(),
        state: state.trim(),
      };
    }

    onSubmit(data);
  };

  // Helper para validar individualmente al perder focus
  const blur = (field: string, ok: boolean, msg: string) => () => {
    setTouched((p) => ({ ...p, [field]: true }));
    setErrors((p) => ok ? { ...p, [field]: '' } : { ...p, [field]: msg });
  };

  const isValid = (field: string, val: string, ok: boolean) =>
    touched[field] && val && ok && !errors[field];

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Sección: Tus datos — header opcional. TiendaFlow lo oculta y renderiza el suyo numerado. */}
      {!hideMainHeader && (
        <SectionHeader title="Tus datos" subtitle="Para enviarte tu eSIM o confirmar tu pedido." />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field
          label="Nombre completo"
          icon={<UserIcon />}
          error={errors.name}
          isValid={isValid('name', name, !!name.trim())}
        >
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={blur('name', !!name.trim(), 'Nombre requerido')}
            placeholder="Juan Pérez"
            className="w-full bg-transparent outline-none font-poppins text-sm text-panda-dark placeholder:text-gray-400"
          />
        </Field>

        <Field
          label="Teléfono de contacto"
          icon={<PhoneIcon />}
          error={errors.phone}
          isValid={isValid('phone', phone, /^\d{10}$/.test(phone))}
        >
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
            onBlur={blur('phone', /^\d{10}$/.test(phone), 'Teléfono de 10 dígitos')}
            placeholder="55 1234 5678"
            inputMode="numeric"
            className="w-full bg-transparent outline-none font-poppins text-sm text-panda-dark placeholder:text-gray-400"
          />
        </Field>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field
          label="Correo electrónico"
          icon={<MailIcon />}
          error={errors.email}
          isValid={isValid('email', email, /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))}
          hint="Si ya cuentas con un correo registrado previamente, ingrésalo.
                Si eres cliente nuevo ingresa tu correo electrónico."
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={blur('email', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), 'Correo válido requerido')}
            placeholder="tu@correo.com"
            className="w-full bg-transparent outline-none font-poppins text-sm text-panda-dark placeholder:text-gray-400"
          />
        </Field>

        <Field
          label="Fecha de nacimiento"
          icon={<BirthDateIcon />}
          error={errors.birthDate}
          isValid={isValid('birthDate', birthDate, !!birthDate)}
        >
          <input
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            onBlur={blur('simType', !!simType, 'Tipo de SIM requerido')}
            className="w-full bg-transparent outline-none font-poppins text-sm text-panda-dark placeholder:text-gray-400"
          />
        </Field>
      </div>

      {/* Sección: Envío (sólo SIM física) — flujo CP-first */}
      {simType === 'sim' && (
        <>
          <SectionHeader title="Dirección de envío" subtitle="Empieza por tu código postal — autocompletamos lo demás." />

          {/* CP grande con auto-detect — primer campo del flujo */}
          <Field
            label="Código postal"
            icon={<MapPinIcon />}
            error={errors.zipCode}
            isValid={isValid('zipCode', zipCode, /^\d{5}$/.test(zipCode))}
            hint={
              cpLoading ? 'Buscando en catálogo SEPOMEX…'
                : cpInfo ? `✓ ${cpInfo.state} · ${cpInfo.municipio} — ${cpInfo.places.length} ${cpInfo.places.length === 1 ? 'asentamiento' : 'asentamientos'}`
                  : zipCode.length === 5 ? 'CP no encontrado en SEPOMEX. Llena estado y colonia manualmente.'
                    : '5 dígitos. Llenamos estado, ciudad y sugerencias de colonia automáticamente.'
            }
          >
            <input
              type="text"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
              onBlur={blur('zipCode', /^\d{5}$/.test(zipCode), 'CP de 5 dígitos')}
              placeholder="06000"
              inputMode="numeric"
              autoComplete="postal-code"
              className="flex-1 bg-transparent outline-none font-mono text-base text-panda-dark placeholder:text-gray-400 tracking-wider"
            />
            {cpLoading && (
              <span className="w-4 h-4 border-2 border-panda-red border-t-transparent rounded-full animate-spin flex-shrink-0" />
            )}
          </Field>

          {/* Estado: dropdown nativo searchable + datalist como fallback */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field
              label="Estado"
              error={errors.state}
              isValid={isValid('state', state, MX_STATES.includes(state))}
            >
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                onBlur={blur('state', !!state.trim(), 'Selecciona tu estado')}
                className="w-full bg-transparent outline-none font-poppins text-sm text-panda-dark cursor-pointer appearance-none pr-7 -mr-1"
                style={{
                  backgroundImage:
                    "url(\"data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='none' viewBox='0 0 24 24' stroke='%237a7a7a' stroke-width='2.5'%3e%3cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3e%3c/svg%3e\")",
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0px center',
                  backgroundSize: '12px',
                }}
              >
                <option value="">Selecciona…</option>
                {MX_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </Field>

            <Field
              label="Ciudad / Municipio"
              error={errors.city}
              isValid={isValid('city', city, !!city.trim())}
            >
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                onBlur={blur('city', !!city.trim(), 'Ciudad requerida')}
                placeholder="Ej. CDMX, Querétaro…"
                autoComplete="address-level2"
                className="w-full bg-transparent outline-none font-poppins text-sm text-panda-dark placeholder:text-gray-400"
              />
            </Field>
          </div>

          {/* Combobox dinámico de colonia — dropdown filtrable con sugerencias SEPOMEX */}
          <ColoniaCombobox
            value={colony}
            onChange={setColony}
            onBlurValidate={() => blur('colony', !!colony.trim(), 'Colonia requerida')()}
            options={cpInfo?.places || []}
            error={errors.colony}
            isValid={isValid('colony', colony, !!colony.trim())}
            hint={
              cpInfo && cpInfo.places.length > 0
                ? `${cpInfo.places.length} ${cpInfo.places.length === 1 ? 'asentamiento' : 'asentamientos'} en este CP según SEPOMEX`
                : 'Escribe el nombre de tu colonia'
            }
          />

          <Field
            label="Calle y número"
            icon={<MapPinIcon />}
            error={errors.street}
            isValid={isValid('street', street, !!street.trim())}
          >
            <input
              type="text"
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              onBlur={blur('street', !!street.trim(), 'Calle requerida')}
              placeholder="Av. Insurgentes Sur 1234, Int. 5"
              autoComplete="street-address"
              className="w-full bg-transparent outline-none font-poppins text-sm text-panda-dark placeholder:text-gray-400"
            />
          </Field>
        </>
      )}

      <button
        type="submit"
        disabled={loading}
        className="hidden"
        id="customer-form-submit"
      >
        Continuar
      </button>
    </form>
  );
}

/* ── ColoniaCombobox — dropdown dinámico con búsqueda y teclado ─── */

interface ColoniaComboboxProps {
  value: string;
  onChange: (v: string) => void;
  onBlurValidate: () => void;
  options: Asentamiento[];   // {name, type}
  error?: string;
  isValid?: boolean;
  hint?: string;
}

function ColoniaCombobox({
  value, onChange, onBlurValidate, options, error, isValid, hint,
}: ColoniaComboboxProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);

  // Filtrar opciones por query (case-insensitive, contiene)
  const q = value.trim().toLowerCase();
  const filtered = q
    ? options.filter((o) => o.name.toLowerCase().includes(q))
    : options;
  const showCustomHint = q && !options.some((o) => o.name.toLowerCase() === q);

  // Click outside cierra
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
        onBlurValidate();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, onBlurValidate]);

  // Reset highlight cuando cambian las opciones filtradas
  useEffect(() => {
    setHighlight(0);
  }, [q, options.length]);

  const choose = (val: string) => {
    onChange(val);
    setOpen(false);
    inputRef.current?.blur();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      setOpen(true);
      return;
    }
    if (!open) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[highlight]) choose(filtered[highlight].name);
      else setOpen(false);   // permite custom value
    }
  };

  return (
    <label className="block">
      <div className="font-poppins text-[11px] font-semibold text-panda-gray uppercase tracking-wider mb-1.5 px-1">
        Colonia / Asentamiento
      </div>

      <div ref={wrapperRef} className="relative">
        <div
          className={`flex items-center gap-3 px-3.5 py-3.5 min-h-[48px] rounded-xl border bg-white transition-all ${error
            ? 'border-red-400 focus-within:ring-2 focus-within:ring-red-100'
            : isValid
              ? 'border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-100'
              : 'border-gray-200 focus-within:border-panda-red focus-within:ring-2 focus-within:ring-panda-red/20'
            }`}
        >
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => { onChange(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            placeholder="Empieza a escribir o elige una sugerencia…"
            autoComplete="address-level3"
            role="combobox"
            aria-expanded={open}
            aria-controls="colonia-listbox"
            aria-autocomplete="list"
            className="w-full bg-transparent outline-none font-poppins text-sm text-panda-dark placeholder:text-gray-400"
          />
          {/* chevron / check / spinner */}
          {isValid ? (
            <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <button
              type="button"
              onClick={() => { setOpen((o) => !o); inputRef.current?.focus(); }}
              aria-label="Mostrar sugerencias"
              className="text-panda-gray hover:text-panda-dark transition-colors flex-shrink-0"
            >
              <svg className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
        </div>

        {/* Dropdown */}
        {open && (
          <ul
            id="colonia-listbox"
            role="listbox"
            className="absolute z-50 left-0 right-0 mt-1.5 bg-white rounded-xl border border-gray-200 shadow-xl max-h-40 sm:max-h-56 overflow-y-auto py-1"
          >
            {/* Header del dropdown — orientación */}
            {options.length > 0 && (
              <li className="px-3.5 py-2 font-poppins text-[10px] uppercase tracking-wider text-panda-gray font-semibold border-b border-gray-100 bg-panda-surface/50">
                {filtered.length > 0
                  ? `${filtered.length} ${filtered.length === 1 ? 'sugerencia' : 'sugerencias'} para este CP`
                  : 'Sin coincidencias en sugerencias'}
              </li>
            )}

            {filtered.map((opt, i) => {
              const selected = opt.name === value;
              const isHighlight = i === highlight;
              return (
                <li
                  key={opt.name}
                  role="option"
                  aria-selected={selected}
                  onMouseDown={(e) => { e.preventDefault(); choose(opt.name); }}
                  onMouseEnter={() => setHighlight(i)}
                  className={`px-3.5 py-2 font-poppins text-sm cursor-pointer flex items-center justify-between gap-2 ${isHighlight ? 'bg-panda-red/10 text-panda-red' : 'text-panda-dark hover:bg-panda-surface'
                    }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="truncate">{opt.name}</p>
                    {opt.type && (
                      <p className={`text-[10px] uppercase tracking-wider mt-0.5 ${isHighlight ? 'text-panda-red/70' : 'text-panda-gray'
                        }`}>
                        {opt.type}
                      </p>
                    )}
                  </div>
                  {selected && (
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </li>
              );
            })}

            {/* CTA "usar valor escrito" cuando hay query y no matchea exacto */}
            {showCustomHint && (
              <li
                role="option"
                aria-selected={false}
                onMouseDown={(e) => { e.preventDefault(); choose(value); }}
                className="px-3.5 py-2 font-poppins text-sm cursor-pointer border-t border-gray-100 text-panda-gray hover:bg-panda-surface flex items-center gap-2"
              >
                <svg className="w-3.5 h-3.5 text-panda-red flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Usar <span className="font-semibold text-panda-dark truncate">"{value}"</span>
              </li>
            )}

            {/* Footer del dropdown — orientación: el catálogo público es limitado */}
            {options.length > 0 && !showCustomHint && (
              <li className="px-3.5 py-2 font-poppins text-[11px] text-panda-gray border-t border-gray-100 bg-panda-surface/50 flex items-start gap-2">
                <svg className="w-3 h-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="leading-snug">
                  ¿No ves tu colonia? Escríbela directamente.
                </span>
              </li>
            )}

            {/* Si NO hay nada (ni opciones ni custom) — empty state */}
            {filtered.length === 0 && !showCustomHint && options.length === 0 && (
              <li className="px-3.5 py-3 font-poppins text-sm text-panda-gray text-center italic">
                Escribe el nombre de tu colonia
              </li>
            )}
          </ul>
        )}
      </div>

      {error ? (
        <p className="text-red-500 text-xs mt-1 px-1 flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {error}
        </p>
      ) : hint ? (
        <p className="text-panda-gray text-xs mt-1 px-1">{hint}</p>
      ) : null}
    </label>
  );
}

/* ── Sub-componentes ─────────────────────────────────────────── */

function SectionHeader({ number, title, subtitle }: { number?: string; title: string; subtitle?: string }) {
  return (
    <div className="flex items-start gap-3 pt-2">
      {number && (
        <span className="font-unbounded text-xs font-bold text-panda-red bg-panda-red/10 rounded-lg w-8 h-8 flex items-center justify-center flex-shrink-0">
          {number}
        </span>
      )}
      <div>
        <p className="font-unbounded text-sm font-bold text-panda-dark">{title}</p>
        {subtitle && <p className="font-poppins text-xs text-panda-gray mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

interface FieldProps {
  label: string;
  icon?: React.ReactNode;
  error?: string;
  isValid?: boolean;
  hint?: string;
  children: React.ReactNode;
}

function Field({ label, icon, error, isValid, hint, children }: FieldProps) {
  return (
    <label className="block">
      <div className="font-poppins text-[11px] font-semibold text-panda-gray uppercase tracking-wider mb-1.5 px-1">
        {label}
      </div>
      <div className={`flex items-center gap-3 px-3.5 py-3.5 min-h-[48px] rounded-xl border bg-white transition-all ${error ? 'border-red-400 focus-within:ring-2 focus-within:ring-red-100'
        : isValid ? 'border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-100'
          : 'border-gray-200 focus-within:border-panda-red focus-within:ring-2 focus-within:ring-panda-red/20'
        }`}>
        {icon && <span className={`flex-shrink-0 ${error ? 'text-red-400' : isValid ? 'text-emerald-500' : 'text-gray-400'}`}>{icon}</span>}
        {children}
        {isValid && (
          <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      {error ? (
        <p className="text-red-500 text-xs mt-1 px-1 flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {error}
        </p>
      ) : hint ? (
        <p className="text-panda-gray text-xs mt-1 px-1">{hint}</p>
      ) : null}
    </label>
  );
}

/* Iconos inline (mismo set que IconCustom para no inflar) */
const UserIcon = () => (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>);
const MailIcon = () => (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>);
const PhoneIcon = () => (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>);
const MapPinIcon = () => (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>);
const BirthDateIcon = () => (<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>);