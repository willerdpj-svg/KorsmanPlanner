'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

interface ImportResult {
  imported: number
  skipped: number
  errors: string[]
  totalRows: number
}

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleImport() {
    if (!file) return

    setImporting(true)
    setError(null)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/import', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Import failed')
        return
      }

      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError('Network error during import')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Import Data</h1>
      <p className="text-muted-foreground">
        Import projects from the Korsman Excel spreadsheet. The system will match columns
        automatically and create clients, projects, department comments, invoices, and notes.
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upload Excel File</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className="flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed p-8 hover:border-primary/50"
            onClick={() => fileInputRef.current?.click()}
          >
            {file ? (
              <>
                <FileSpreadsheet className="mb-2 h-8 w-8 text-green-500" />
                <p className="text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </>
            ) : (
              <>
                <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium">Click to select Excel file</p>
                <p className="text-xs text-muted-foreground">.xlsx or .xls</p>
              </>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => {
              setFile(e.target.files?.[0] || null)
              setResult(null)
              setError(null)
            }}
          />

          <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground space-y-1">
            <p className="font-medium">Expected format:</p>
            <p>The standard Korsman "Admin Applications" Excel format with columns for File Number, Municipality, Portal Reference, Client Information, Application dates, Department Comments, Invoices, Notes, etc.</p>
            <p>Duplicate file numbers will be skipped. Existing clients will be matched by name.</p>
          </div>

          <Button
            onClick={handleImport}
            disabled={!file || importing}
            className="w-full"
          >
            {importing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importing... (this may take a while)
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Start Import
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-red-200">
          <CardContent className="flex items-center gap-3 pt-6">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <p className="text-sm text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Import Complete
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="rounded-md bg-green-50 p-3">
                <p className="text-2xl font-bold text-green-600">{result.imported}</p>
                <p className="text-xs text-muted-foreground">Imported</p>
              </div>
              <div className="rounded-md bg-amber-50 p-3">
                <p className="text-2xl font-bold text-amber-600">{result.skipped}</p>
                <p className="text-xs text-muted-foreground">Skipped</p>
              </div>
              <div className="rounded-md bg-slate-50 p-3">
                <p className="text-2xl font-bold text-slate-600">{result.totalRows}</p>
                <p className="text-xs text-muted-foreground">Total Rows</p>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-red-600">
                  Errors ({result.errors.length}):
                </p>
                <div className="max-h-40 overflow-y-auto rounded-md bg-red-50 p-2 text-xs">
                  {result.errors.map((err, i) => (
                    <p key={i}>{err}</p>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
