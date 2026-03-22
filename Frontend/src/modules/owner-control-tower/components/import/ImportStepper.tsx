type ImportStepperProps = {
  currentStep: number;
  steps: string[];
};

export default function ImportStepper({ currentStep, steps }: ImportStepperProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-6">
      {steps.map((step, index) => {
        const isActive = index === currentStep;
        const isDone = index < currentStep;

        return (
          <div
            key={step}
            className={`rounded-[1.35rem] border p-4 transition ${
              isActive
                ? 'border-teal-200 bg-teal-50'
                : isDone
                  ? 'border-emerald-200 bg-emerald-50'
                  : 'border-slate-200 bg-white'
            }`}
          >
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-slate-500">
              Step {index + 1}
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-950">{step}</p>
          </div>
        );
      })}
    </div>
  );
}
