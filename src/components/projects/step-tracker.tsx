'use client'

import { Check } from 'lucide-react'
import { APPLICATION_STEPS } from '@/types'
import { cn } from '@/lib/utils'

interface StepTrackerProps {
  currentStep: number
  onStepClick?: (step: number) => void
  compact?: boolean
}

export function StepTracker({ currentStep, onStepClick, compact }: StepTrackerProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {APPLICATION_STEPS.map((step, index) => (
          <div key={step.step} className="flex flex-1 items-center">
            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={() => onStepClick?.(step.step)}
                disabled={!onStepClick}
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold transition-all',
                  step.step < currentStep &&
                    'border-green-500 bg-green-500 text-white',
                  step.step === currentStep &&
                    'border-blue-500 bg-blue-500 text-white animate-pulse',
                  step.step > currentStep &&
                    'border-muted-foreground/30 text-muted-foreground/50',
                  onStepClick && 'cursor-pointer hover:opacity-80'
                )}
              >
                {step.step < currentStep ? (
                  <Check className="h-4 w-4" />
                ) : (
                  step.step
                )}
              </button>
              {!compact && (
                <span
                  className={cn(
                    'mt-2 text-center text-[11px] font-medium leading-tight',
                    step.step <= currentStep
                      ? 'text-foreground'
                      : 'text-muted-foreground/50'
                  )}
                  style={{ maxWidth: '80px' }}
                >
                  {step.label}
                </span>
              )}
            </div>
            {index < APPLICATION_STEPS.length - 1 && (
              <div
                className={cn(
                  'mx-1 h-0.5 flex-1',
                  step.step < currentStep ? 'bg-green-500' : 'bg-muted-foreground/20'
                )}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
