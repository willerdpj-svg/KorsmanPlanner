'use client'

import { Check } from 'lucide-react'
import { APPLICATION_STEPS, type ApplicationStep } from '@/types'
import { cn } from '@/lib/utils'

interface StepTrackerProps {
  currentStep: number
  steps?: ApplicationStep[]
  onStepClick?: (step: number) => void
  compact?: boolean
}

export function StepTracker({ currentStep, steps, onStepClick, compact }: StepTrackerProps) {
  const resolvedSteps = steps ?? [...APPLICATION_STEPS]

  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {resolvedSteps.map((step, index) => (
          <div key={step.step} className="flex flex-1 items-center">
            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={() => onStepClick?.(step.step)}
                disabled={!onStepClick}
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-all',
                  step.step < currentStep &&
                    'bg-emerald-500 text-white shadow-sm',
                  step.step === currentStep &&
                    'bg-primary text-white shadow-sm ring-4 ring-primary/20',
                  step.step > currentStep &&
                    'bg-muted text-muted-foreground/50',
                  onStepClick && 'cursor-pointer hover:opacity-80'
                )}
              >
                {step.step < currentStep ? (
                  <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                ) : (
                  step.step
                )}
              </button>
              {!compact && (
                <span
                  className={cn(
                    'mt-2 text-center text-[10px] font-medium leading-tight',
                    step.step <= currentStep
                      ? 'text-foreground/80'
                      : 'text-muted-foreground/40'
                  )}
                  style={{ maxWidth: '72px' }}
                >
                  {step.label}
                </span>
              )}
            </div>
            {index < resolvedSteps.length - 1 && (
              <div
                className={cn(
                  'mx-1 h-[2px] flex-1 rounded-full',
                  step.step < currentStep ? 'bg-emerald-500' : 'bg-muted'
                )}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
