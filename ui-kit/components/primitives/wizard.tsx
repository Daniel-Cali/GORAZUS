import * as React from 'react';
import { Check } from 'lucide-react';
import { cn } from '../../lib/cn';
import { Button } from './button';

export interface WizardStep {
  id: string;
  label: string;
  content: React.ReactNode;
}

export interface WizardProps {
  steps: WizardStep[];
  activeStep: number;
  onStepChange: (step: number) => void;
  onFinish: () => void;
  /** Deshabilita "Siguiente" en el paso actual — validación por paso (docs/product/09_WIREFRAMES.md, arquetipo Wizard). */
  canAdvance?: boolean;
  finishLabel?: string;
  className?: string;
}

/** Formulario de múltiples pasos (docs/product/09_WIREFRAMES.md) — cada paso valida antes de avanzar, nunca junta todo en un solo submit gigante. */
export function Wizard({
  steps,
  activeStep,
  onStepChange,
  onFinish,
  canAdvance = true,
  finishLabel = 'Finalizar',
  className,
}: WizardProps) {
  const isLastStep = activeStep === steps.length - 1;

  return (
    <div className={cn('space-y-6', className)}>
      <ol className="flex items-center">
        {steps.map((step, index) => {
          const isCompleted = index < activeStep;
          const isActive = index === activeStep;
          return (
            <li key={step.id} className="flex flex-1 items-center last:flex-none">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-medium',
                    isCompleted && 'border-primary bg-primary text-primary-foreground',
                    isActive && !isCompleted && 'border-primary text-primary',
                    !isActive && !isCompleted && 'border-muted-foreground/30 text-muted-foreground',
                  )}
                >
                  {isCompleted ? <Check className="h-4 w-4" /> : index + 1}
                </span>
                <span
                  className={cn(
                    'text-sm',
                    isActive ? 'font-medium text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={cn('mx-3 h-px flex-1', isCompleted ? 'bg-primary' : 'bg-border')} />
              )}
            </li>
          );
        })}
      </ol>

      <div>{steps[activeStep]?.content}</div>

      <div className="flex justify-between border-t pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => onStepChange(activeStep - 1)}
          disabled={activeStep === 0}
        >
          Atrás
        </Button>
        {isLastStep ? (
          <Button type="button" onClick={onFinish} disabled={!canAdvance}>
            {finishLabel}
          </Button>
        ) : (
          <Button type="button" onClick={() => onStepChange(activeStep + 1)} disabled={!canAdvance}>
            Siguiente
          </Button>
        )}
      </div>
    </div>
  );
}
