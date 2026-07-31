import { useState } from 'react';

interface IccidStepProps {
  onValidated: (iccid: string) => void;
  loading?: boolean;
  error?: string | null;
  /** Valor precargado (p.ej. ?msisdn= de la URL). */
  initialValue?: string;
}

export default function IccidStep({ onValidated, loading, error, initialValue = '' }: IccidStepProps) {
  const [value, setValue] = useState(initialValue);
  const [showHelp, setShowHelp] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = value.replace(/\D/g, '');

    if (cleaned.length === 10) {
      onValidated(cleaned);
    } else if (cleaned.length >= 19 && cleaned.length <= 20) {
      onValidated(cleaned);
    } else {
      setLocalError('Ingresa un número de 10 dígitos o el código ICCID (19-20 caracteres)');
    }
  };

  const displayError = error || localError;

  return (
    <div className="max-w-xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h3 className="font-unbounded text-lg font-semibold text-[#0f172a] mb-2 text-center">
          Ingresa tu número
        </h3>
        <p className="font-poppins text-sm text-[#7a7a7a] text-center mb-6">
          Tu número celular de 10 dígitos o el código ICCID de tu SIM
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            inputMode="numeric"
            value={value}
            onChange={(e) => {
              setValue(e.target.value.replace(/\D/g, '').slice(0, 20));
              setLocalError('');
            }}
            placeholder="10 dígitos o ICCID"
            className="w-full rounded-xl border border-gray-300 px-4 py-4 font-poppins text-lg text-center tracking-wider focus:border-[#1a1e29] focus:ring-2 focus:ring-[#1a1e29]/20 outline-none transition-colors"
            autoFocus
          />

          {displayError && (
            <p className="text-red-500 text-sm text-center">{displayError}</p>
          )}

          <button
            type="button"
            onClick={() => setShowHelp(!showHelp)}
            className="text-sm text-[#1a1e29] hover:underline font-poppins block mx-auto"
          >
            ¿Dónde encuentro mi ICCID?
          </button>

          {showHelp && (
            <div className="bg-[#f8fafc] rounded-xl p-4 text-sm font-poppins text-[#7a7a7a] space-y-2">
              <p>El ICCID es un código de 19-20 dígitos que encontrarás:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Impreso en tu tarjeta SIM</li>
                <li>En la bandeja de la SIM de tu teléfono</li>
                <li>En Ajustes → Información del dispositivo → Estado de la SIM</li>
              </ul>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || value.length < 10}
            className="w-full rounded-full bg-[#1a1e29] text-white font-bold py-4 text-lg shadow-lg shadow-[#1a1e29]/30 hover:bg-[#2a3040] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Validando...
              </span>
            ) : (
              'Continuar →'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
