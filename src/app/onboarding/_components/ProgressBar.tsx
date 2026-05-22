interface Step {
  label: string;
  number: number;
}

const STEPS: Step[] = [
  { number: 1, label: "Negocio" },
  { number: 2, label: "Marca" },
  { number: 3, label: "Horarios" },
  { number: 4, label: "Dominio" },
  { number: 5, label: "Website" },
  { number: 6, label: "Revisar" },
];

interface ProgressBarProps {
  currentStep: number;
  totalSteps?: number;
}

export default function ProgressBar({ currentStep }: ProgressBarProps) {
  return (
    <div className="flex items-center justify-between mb-10">
      {STEPS.map((step, idx) => {
        const isCompleted = step.number < currentStep;
        const isActive = step.number === currentStep;

        return (
          <div key={step.number} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all"
                style={{
                  backgroundColor:
                    isCompleted || isActive ? "#F67D0A" : "#e5e7eb",
                  color: isCompleted || isActive ? "#fff" : "#9ca3af",
                }}
              >
                {isCompleted ? (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  step.number
                )}
              </div>
              <span
                className="text-xs mt-1 font-medium text-center"
                style={{
                  color: isCompleted || isActive ? "#1E2C46" : "#9ca3af",
                }}
              >
                {step.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className="h-0.5 flex-1 mx-1 -mt-5 transition-all"
                style={{
                  backgroundColor:
                    step.number < currentStep ? "#F67D0A" : "#e5e7eb",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
