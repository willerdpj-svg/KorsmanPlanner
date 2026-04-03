'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { StepTracker } from './step-tracker'
import type { ApplicationStep } from '@/types'

interface InteractiveStepTrackerProps {
  projectId: string
  currentStep: number
  steps: ApplicationStep[]
}

export function InteractiveStepTracker({ projectId, currentStep, steps }: InteractiveStepTrackerProps) {
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState(currentStep)

  async function handleStepClick(newStep: number) {
    setStep(newStep)

    await supabase
      .from('projects')
      .update({ current_step: newStep })
      .eq('id', projectId)

    router.refresh()
  }

  return <StepTracker currentStep={step} steps={steps} onStepClick={handleStepClick} />
}
