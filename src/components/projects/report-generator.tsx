'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Download, Loader2 } from 'lucide-react'
import { formatDate } from '@/lib/utils/format'
import type { ProgressReport } from '@/types'

interface ReportGeneratorProps {
  projectId: string
  fileNumber: string
  reports: ProgressReport[]
}

export function ReportGenerator({ projectId, fileNumber, reports }: ReportGeneratorProps) {
  const router = useRouter()
  const [generating, setGenerating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [narrative, setNarrative] = useState('')

  async function handleGenerate() {
    if (!narrative.trim()) return
    setGenerating(true)

    try {
      const response = await fetch(`/api/reports/${projectId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ narrative }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `Progress-Report-${fileNumber}-${reports.length + 1}.pdf`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

        setNarrative('')
        setShowForm(false)
        router.refresh()
      }
    } finally {
      setGenerating(false)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Progress Reports ({reports.length})</CardTitle>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <FileText className="mr-1 h-3 w-3" />
          Generate Report
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {showForm && (
          <div className="space-y-3 rounded-md border p-3">
            <div className="space-y-2">
              <Label>Report Narrative</Label>
              <Textarea
                placeholder="Describe the current status of the application, recent progress, and any notable developments..."
                value={narrative}
                onChange={(e) => setNarrative(e.target.value)}
                rows={6}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleGenerate} disabled={generating || !narrative.trim()} size="sm">
                {generating ? (
                  <>
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="mr-1 h-3 w-3" />
                    Generate & Download PDF
                  </>
                )}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {reports.length > 0 ? (
          <div className="space-y-2">
            {reports.map((report) => (
              <div key={report.id} className="flex items-center justify-between rounded-md border p-3">
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <span className="text-sm font-medium">Report #{report.report_number}</span>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(report.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          !showForm && (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No reports generated yet.
            </p>
          )
        )}
      </CardContent>
    </Card>
  )
}
