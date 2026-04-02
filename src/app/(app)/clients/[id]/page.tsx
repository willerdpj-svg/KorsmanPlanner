import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/projects/status-badge'
import { StepTracker } from '@/components/projects/step-tracker'
import { formatDateLong } from '@/lib/utils/format'
import { Phone, Mail, MapPin } from 'lucide-react'
import Link from 'next/link'
import type { ProjectStatus } from '@/types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getJoinedName(val: any): string | null {
  if (!val) return null
  if (Array.isArray(val)) return val[0]?.name || null
  return val.name || null
}

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: client, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !client) {
    notFound()
  }

  const { data: projects } = await supabase
    .from('projects')
    .select(`
      id, file_number, current_step, status, updated_at,
      application_type_id,
      application_types(name)
    `)
    .eq('client_id', id)
    .order('updated_at', { ascending: false })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">{client.name}</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {client.phone_cell && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{client.phone_cell}</span>
              {client.phone_landline && (
                <span className="text-muted-foreground">/ {client.phone_landline}</span>
              )}
            </div>
          )}
          {client.email && (
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{client.email}</span>
            </div>
          )}
          {client.physical_address && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{client.physical_address}</span>
            </div>
          )}
          {client.postal_address && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Postal: {client.postal_address}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Projects ({projects?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {projects && projects.length > 0 ? (
            <div className="divide-y">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-muted/50"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold">
                        {project.file_number}
                      </span>
                      <StatusBadge status={project.status as ProjectStatus} />
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {getJoinedName(project.application_types) || 'No type'}
                    </p>
                  </div>
                  <div className="hidden w-48 sm:block">
                    <StepTracker currentStep={project.current_step} compact />
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatDateLong(project.updated_at)}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No projects for this client.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
