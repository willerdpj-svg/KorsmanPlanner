'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { StepTracker } from './step-tracker'

interface InteractiveStepTrackerProps {
  projectId: string
  currentStep: number
}

export function InteractiveStepTracker({ projectId, currentStep }: InteractiveStepTrackerProps) {
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

  return <StepTracker currentStep={step} onStepClick={handleStepClick} />
}
