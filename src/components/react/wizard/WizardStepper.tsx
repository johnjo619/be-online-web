interface Step {
  key: string;
  label: string;
}

interface WizardStepperProps {
  steps: Step[];
  activeStep: number;
}

export default function WizardStepper({ steps, activeStep }: WizardStepperProps) {
  return (
    <div className="flex items-center justify-center mb-8">
      {steps.map((step, i) => {
        const isCompleted = i < activeStep;
        const isActive = i === activeStep;
        const isPending = i > activeStep;

        return (
          <div key={step.key} className="flex items-center">
            {/* Circle */}
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-unbounded font-bold transition-all duration-300 ${
                  isCompleted
                    ? 'bg-[#04AA6D] text-white'
                    : isActive
                    ? 'bg-[#1a1e29] text-white shadow-lg shadow-[#1a1e29]/30'
                    : 'bg-gray-200 text-gray-400'
                }`}
              >
                {isCompleted ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={`text-xs font-poppins mt-2 whitespace-nowrap ${
                  isActive ? 'text-[#0f172a] font-semibold' : 'text-[#7a7a7a]'
                } ${isPending ? 'hidden sm:block' : ''}`}
              >
                {step.label}
              </span>
            </div>

            {/* Connecting line */}
            {i < steps.length - 1 && (
              <div
                className={`h-0.5 w-8 sm:w-16 mx-2 transition-colors duration-300 ${
                  isCompleted ? 'bg-[#04AA6D]' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
