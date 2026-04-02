import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { ProgressReportDocument } from '@/lib/pdf/report-template'
import path from 'path'
import React from 'react'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get narrative from request body
  const body = await request.json()
  const narrative = body.narrative || ''

  // Fetch project with relations
  const { data: project, error } = await supabase
    .from('projects')
    .select(`
      *,
      client:clients(name),
      application_type:application_types(name),
      municipality:municipalities(name, code),
      assigned_planner:profiles!projects_assigned_planner_id_fkey(full_name, title),
      department_comments(*)
    `)
    .eq('id', projectId)
    .single()

  if (error || !project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  // Get planner profile (use assigned planner or current user)
  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('full_name, title')
    .eq('id', user.id)
    .single()

  // Get next report number
  const { count } = await supabase
    .from('progress_reports')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId)

  const reportNumber = (count || 0) + 1
  const reportDate = new Date().toLocaleDateString('en-ZA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  const client = project.client as { name: string } | null
  const applicationType = project.application_type as { name: string } | null
  const municipality = project.municipality as { name: string; code: string } | null
  const assignedPlanner = project.assigned_planner as { full_name: string; title: string | null } | null
  const departments = (project.department_comments || []) as {
    department: string
    status: string
    requested_date: string | null
    received_date: string | null
  }[]

  const logoPath = path.join(process.cwd(), 'public', 'images', 'korsman-logo.jpeg')
  const signaturePath = path.join(process.cwd(), 'public', 'images', 'swarts-signature.png')

  const reportData = {
    reportNumber,
    reportDate,
    project: {
      file_number: project.file_number,
      portal_reference: project.portal_reference,
      scheme_number: project.scheme_number,
      current_step: project.current_step,
      legal_description: project.legal_description,
      physical_address: project.physical_address,
      present_zoning: project.present_zoning,
      zoning_applied_for: project.zoning_applied_for,
      application_submission_date: project.application_submission_date,
    },
    applicationType: applicationType?.name || null,
    municipality,
    client,
    planner: assignedPlanner || currentProfile,
    departments,
    narrative,
    logoPath,
    signaturePath,
  }

  // Generate PDF
  const pdfBuffer = await renderToBuffer(
    React.createElement(ProgressReportDocument, { data: reportData }) as any
  )

  // Save report record
  await supabase.from('progress_reports').insert({
    project_id: projectId,
    report_number: reportNumber,
    generated_by: user.id,
    narrative,
  })

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="Progress-Report-${project.file_number}-${reportNumber}.pdf"`,
    },
  })
}
