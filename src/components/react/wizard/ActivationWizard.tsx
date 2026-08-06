import { useReducer, useState } from 'react';
import { validateIccid } from '../../../lib/api';
import type { WizardState, WizardAction, WizardFlow, Plan, IccidValidation } from '../../../lib/types';
import WizardStepper from './WizardStepper';
import IccidStep from './IccidStep';
import FlowStep from './FlowStep';
import PlansStep from './PlansStep';
import PaymentStep from './PaymentStep';
import SuccessStep from './SuccessStep';

const INITIAL_STATE: WizardState = {
  iccidInput: '',
  msisdn: null,
  simType: '',
  actions: null,
  flow: null,
  offerId: null,
  offerName: '',
  paid: false,
  address: '',
  broadband: '',
  step: 0,
};

function reducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'SET_ICCID':
      return { ...state, iccidInput: action.payload };
    case 'SET_ICCID_RESULT':
      return {
        ...state,
        msisdn: action.payload.dn,
        simType: action.payload.type as WizardState['simType'],
        actions: action.payload,
        step: 1,
      };
    case 'SET_FLOW':
      return { ...state, flow: action.payload, step: 2 };
    case 'SET_OFFER':
      return { ...state, offerId: action.payload.id, offerName: action.payload.name, step: 3 };
    case 'SET_PAID':
      return { ...state, paid: action.payload, step: 4 };
    case 'SET_ADDRESS':
      return { ...state, address: action.payload.address, broadband: action.payload.broadband };
    case 'NEXT_STEP':
      return { ...state, step: state.step + 1 };
    case 'PREV_STEP':
      return { ...state, step: Math.max(0, state.step - 1) };
    case 'SET_STEP':
      return { ...state, step: action.payload };
    case 'RESET':
      return INITIAL_STATE;
    default:
      return state;
  }
}

const STEPS = [
  { key: 'iccid', label: 'Número' },
  { key: 'flow', label: 'Acción' },
  { key: 'plan', label: 'Plan' },
  { key: 'payment', label: 'Pago' },
];

export default function ActivationWizard() {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const [iccidLoading, setIccidLoading] = useState(false);
  const [iccidError, setIccidError] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  // Prefill del número desde la URL (?msisdn= o ?numero=) — los CTAs
  // internos pueden mandar al usuario con su número ya capturado.
  const [initialMsisdn] = useState(() => {
    if (typeof window === 'undefined') return '';
    const p = new URLSearchParams(window.location.search);
    return (p.get('msisdn') || p.get('numero') || '').replace(/\D/g, '').slice(0, 20);
  });

  const handleIccidValidated = async (iccid: string) => {
    setIccidLoading(true);
    setIccidError(null);
    dispatch({ type: 'SET_ICCID', payload: iccid });

    try {
      const result: IccidValidation = await validateIccid(iccid);
      if (!result.processable) {
        setIccidError('Este número no es válido o no está disponible.');
        setIccidLoading(false);
        return;
      }
      dispatch({ type: 'SET_ICCID_RESULT', payload: result });
    } catch {
      setIccidError('Error al validar. Intenta de nuevo.');
    } finally {
      setIccidLoading(false);
    }
  };

  const handleFlowSelect = (flow: WizardFlow) => {
    dispatch({ type: 'SET_FLOW', payload: flow });
  };

  const handlePlanSelect = (plan: Plan) => {
    setSelectedPlan(plan);
    dispatch({ type: 'SET_OFFER', payload: { id: plan.id, name: plan.display_name || plan.name } });
  };

  const handlePaid = () => {
    dispatch({ type: 'SET_PAID', payload: true });
  };

  return (
    <div className="space-y-6">
      <WizardStepper steps={STEPS} activeStep={state.step} />

      {/* Step 0: ICCID */}
      {state.step === 0 && (
        <IccidStep
          onValidated={handleIccidValidated}
          loading={iccidLoading}
          error={iccidError}
          initialValue={initialMsisdn}
        />
      )}

      {/* Step 1: Flow Selection */}
      {state.step === 1 && state.actions && (
        <FlowStep
          actions={state.actions}
          onSelect={handleFlowSelect}
        />
      )}

      {/* Step 2: Plan Selection */}
      {state.step === 2 && state.msisdn && (
        <PlansStep
          msisdn={state.msisdn}
          simType={state.simType}
          onSelect={handlePlanSelect}
        />
      )}

      {/* Step 3: Payment */}
      {state.step === 3 && state.msisdn && selectedPlan && (
        <PaymentStep
          msisdn={state.msisdn}
          plan={selectedPlan}
          onPaid={handlePaid}
        />
      )}

      {/* Step 4: Success */}
      {state.step === 4 && (
        <SuccessStep
          flow={state.flow || 'activar'}
          planName={state.offerName}
        />
      )}

      {/* Back button (steps 1-3) */}
      {state.step > 0 && state.step < 4 && (
        <div className="text-center mt-4">
          <button
            onClick={() => dispatch({ type: 'PREV_STEP' })}
            className="text-sm text-[#7a7a7a] hover:text-[#142035] font-poppins transition-colors"
          >
            ← Volver al paso anterior
          </button>
        </div>
      )}
    </div>
  );
}
