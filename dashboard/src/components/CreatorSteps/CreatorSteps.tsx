import { cn } from "@dashboard/utils/cn";
import { Text } from "@saleor/macaw-ui-next";

export interface Step<T> {
  label: string;
  value: T;
}

interface CreatorStepsProps<T> {
  currentStep: T;
  steps: Array<Step<T>>;
  onStepClick: (step: T) => void;
}

function makeCreatorSteps<T extends string | number>() {
  const CreatorSteps = ({ currentStep, steps, onStepClick }: CreatorStepsProps<T>) => {
    return (
      <div className="border-b border-divider flex justify-between mb-6">
        {steps.map((step, stepIndex) => {
          const visitedStep = steps.findIndex(step => step.value === currentStep) >= stepIndex;

          return (
            <div
              className={cn(
                "flex-1 pb-2 select-none",
                step.value === currentStep && "font-semibold",
                visitedStep && "border-b-[3px] border-primary cursor-pointer",
              )}
              onClick={visitedStep ? () => onStepClick(step.value) : undefined}
              key={step.value}
            >
              <Text className="text-sm text-center" size={2} fontWeight="light">
                {step.label}
              </Text>
            </div>
          );
        })}
      </div>
    );
  };

  CreatorSteps.displayName = "CreatorSteps";

  return CreatorSteps;
}

export default makeCreatorSteps;
