import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import * as XLSX from 'xlsx'

// Column indices (0-based) from the Excel file
const COL = {
  FILE_NUMBER: 0,       // "File Number"
  MUNICIPALITY: 1,      // Municipality code (e.g. "ELMC")
  PORTAL_REF: 2,        // "Portal reference number"
  SCHEME_NO: 3,         // "SA" / "Scheme no"
  SP_NUMBER: 4,         // "SP Number"
  STATUS_CELL: 5,       // "Legal" - contains status like "approved"
  LEGAL_DESC: 6,        // "Legal Notices"
  PRESENT_ZONING: 7,    // "Present Zoning"
  ZONING_APPLIED: 8,    // "Zoning Applied for"
  PHYS_ADDRESS: 9,      // "ADDRESS Physical"
  POST_ADDRESS: 10,     // "ADDRESS Postal"
  CLIENT_NAME: 11,      // "Client information"
  PHONE_LAND: 12,       // "TELEPHONE NR Land Line"
  PHONE_CELL: 13,       // "TELEPHONE NR Cell Number"
  EMAIL: 14,            // "E Mail Address"
  QUOT_NUMBER: 15,      // "Quotation NR"
  QUOT_DATE: 16,        // "Date accepting Quotation"
  APP_SUBMITTED: 17,    // "APPLICATION Submitted"
  PROOF_ADS: 18,        // "Proof of Ads & Affidavit Submitted"
  BH_REQUESTED: 19,     // "BONDHOLDERS CONSENT Requested"
  BH_RECEIVED: 20,      // "BONDHOLDERS CONSENT Received"
  BH_SUBMITTED: 21,     // "BONDHOLDERS CONSENT Submitting"
  OBJECTIONS: 22,       // "Objections"
  OBJ_COMMENT: 23,      // "Comment on objection submitted"
  HEARING: 24,          // "Hearing Date"
  APPROVAL: 25,         // "Application Approval"
  BULK_AMOUNT: 26,      // "BULK SERVICES CONTRIBUTION Contribution"
  BULK_PAID: 27,        // "Service Contr Paid"
  BULK_COUNCIL: 28,     // "Submitted to Council"
  PROOF_FINES: 29,      // "Proof of payment Fines"
  MAPS_SUBMITTED: 30,   // "FINAL Map 3's Submitted"
  MAPS_APPROVED: 31,    // "FINAL Map 3's Approved"
  RRC_DATE: 32,         // "RRC Date"
  PROCLAMATION: 33,     // "Proclamation Date"
  CONSENT_70: 34,       // "70/70or 21/40 Consent received"
  SANRAL: 35,           // "SANRAL comments"
  // 36 is empty
  INV_NUMBER: 37,       // "Invoice number"
  INV_AMOUNT: 38,       // "Invoice Amount"
  AMOUNT_PAID: 39,      // "Amount paid"
  // 40 = "Balance outstanding" (calculated)
  PAYMENT_NOTES: 41,    // "Payment notes"
  DEPT_ELEC: 42,        // "Elec"
  DEPT_WS: 43,          // "W/S"
  DEPT_RS: 44,          // "R/S"
  DEPT_ENV: 45,         // "Env"
  DEPT_BUILD: 46,       // "Build"
  DEPT_TP: 47,          // "TP"
  NOTES: 48,            // "Notes"
  SR_PROGRESS: 49,      // "SR Vordering"
  SR_PROGRESS2: 50,     // "SR Vordering" (second column)
  CLIENT_PROGRESS: 51,  // "Client Progress sent"
  APPROVED: 52,         // "Approved" (status flag)
  CANCELLED: 53,        // "Cancelled / On Hold / Not submitted"
  NOT_APPROVED: 54,     // "Not approved / Ongoing / Appeal"
}

function parseExcelDate(val: unknown): string | null {
  if (!val) return null
  if (typeof val === 'number') {
    // Excel serial date
    const d = XLSX.SSF.parse_date_code(val)
    if (d) {
      return `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`
    }
  }
  if (typeof val === 'string') {
    // Try DD/MM/YYYY
    const match = val.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
    if (match) {
      return `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`
    }
    // If it's "N/A" or similar, return null
    if (val.toLowerCase() === 'n/a' || val.toLowerCase() === 'n' || val.trim() === '') return null
  }
  return null
}

function parseStatus(row: unknown[]): string {
  const statusCell = String(row[COL.STATUS_CELL] || '').toLowerCase()
  const approved = row[COL.APPROVED]
  const cancelled = row[COL.CANCELLED]
  const notApproved = row[COL.NOT_APPROVED]

  if (statusCell === 'approved' || approved) return 'approved'
  if (statusCell === 'cancelled' || cancelled) return 'cancelled'
  if (statusCell === 'not approved' || notApproved) return 'not_approved'
  if (statusCell === 'on hold' || (typeof cancelled === 'string' && cancelled.toLowerCase().includes('hold'))) return 'on_hold'
  return 'active'
}

function determinStep(row: unknown[]): number {
  if (row[COL.PROCLAMATION]) return 7
  if (row[COL.APPROVAL]) return 7
  if (row[COL.HEARING]) return 6

  // Check departments
  const depts = [COL.DEPT_ELEC, COL.DEPT_WS, COL.DEPT_RS, COL.DEPT_ENV, COL.DEPT_BUILD, COL.DEPT_TP]
  const deptReceived = depts.filter((d) => row[d] && String(row[d]).toLowerCase() === 'x').length
  if (deptReceived === 6) return 4
  if (deptReceived > 0) return 3

  if (row[COL.PROOF_ADS]) return 2
  if (row[COL.APP_SUBMITTED]) return 1
  return 1
}

function str(val: unknown): string | null {
  if (val === null || val === undefined) return null
  const s = String(val).trim()
  return s === '' || s.toLowerCase() === 'n/a' ? null : s
}

function num(val: unknown): number | null {
  if (val === null || val === undefined) return null
  const n = Number(val)
  return isNaN(n) ? null : n
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File
  if (!file) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const workbook = XLSX.read(buffer, { type: 'buffer' })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][]

  // Skip header rows (first 2 rows)
  const dataRows = rawData.slice(2).filter((row) => row[COL.FILE_NUMBER])

  // Fetch existing lookup data
  const [muniRes, typeRes] = await Promise.all([
    supabase.from('municipalities').select('id, code'),
    supabase.from('application_types').select('id, name'),
  ])
  const municipalities = muniRes.data || []
  const applicationTypes = typeRes.data || []

  const muniMap = new Map(municipalities.map((m) => [m.code, m.id]))

  // Determine application type from zoning context (basic heuristic)
  function guessApplicationType(row: unknown[]): string | null {
    const presentZoning = str(row[COL.PRESENT_ZONING])?.toLowerCase() || ''
    const appliedFor = str(row[COL.ZONING_APPLIED]) ?.toLowerCase() || ''

    if (presentZoning !== appliedFor && appliedFor) {
      const rezoning = applicationTypes.find((t) => t.name === 'Rezoning')
      return rezoning?.id || null
    }
    return null
  }

  // Track clients we create
  const clientMap = new Map<string, string>()

  let imported = 0
  let skipped = 0
  let errors: string[] = []

  for (const row of dataRows) {
    const fileNumber = str(row[COL.FILE_NUMBER])
    if (!fileNumber) {
      skipped++
      continue
    }

    try {
      // Find or create client
      let clientId: string | null = null
      const clientName = str(row[COL.CLIENT_NAME])
      if (clientName) {
        if (clientMap.has(clientName)) {
          clientId = clientMap.get(clientName)!
        } else {
          // Check if client exists
          const { data: existingClient } = await supabase
            .from('clients')
            .select('id')
            .eq('name', clientName)
            .maybeSingle()

          if (existingClient) {
            clientId = existingClient.id
          } else {
            const { data: newClient } = await supabase
              .from('clients')
              .insert({
                name: clientName,
                phone_landline: str(row[COL.PHONE_LAND]),
                phone_cell: str(row[COL.PHONE_CELL]),
                email: str(row[COL.EMAIL]),
                postal_address: str(row[COL.POST_ADDRESS]),
              })
              .select('id')
              .single()
            if (newClient) clientId = newClient.id
          }
          if (clientId) clientMap.set(clientName, clientId)
        }
      }

      // Find municipality
      const muniCode = str(row[COL.MUNICIPALITY])
      const municipalityId = muniCode ? muniMap.get(muniCode) || null : null

      const status = parseStatus(row)
      const currentStep = determinStep(row)

      // Check for duplicate file number
      const { data: existing } = await supabase
        .from('projects')
        .select('id')
        .eq('file_number', fileNumber)
        .maybeSingle()

      if (existing) {
        skipped++
        continue
      }

      // Insert project
      const { data: project, error: projError } = await supabase
        .from('projects')
        .insert({
          file_number: fileNumber,
          portal_reference: str(row[COL.PORTAL_REF]),
          scheme_number: str(row[COL.SCHEME_NO]),
          sp_number: str(row[COL.SP_NUMBER]),
          application_type_id: guessApplicationType(row),
          municipality_id: municipalityId,
          client_id: clientId,
          legal_description: str(row[COL.LEGAL_DESC]),
          physical_address: str(row[COL.PHYS_ADDRESS]),
          present_zoning: str(row[COL.PRESENT_ZONING]),
          zoning_applied_for: str(row[COL.ZONING_APPLIED]),
          current_step: currentStep,
          status,
          quotation_number: str(row[COL.QUOT_NUMBER]),
          quotation_date: parseExcelDate(row[COL.QUOT_DATE]),
          date_accepting: parseExcelDate(row[COL.QUOT_DATE]),
          application_submission_date: parseExcelDate(row[COL.APP_SUBMITTED]),
          proof_of_ads_date: parseExcelDate(row[COL.PROOF_ADS]),
          bondholder_consent_requested: parseExcelDate(row[COL.BH_REQUESTED]),
          bondholder_consent_received: parseExcelDate(row[COL.BH_RECEIVED]),
          bondholder_consent_submitted: parseExcelDate(row[COL.BH_SUBMITTED]),
          objections: String(row[COL.OBJECTIONS] || '').toLowerCase() === 'y',
          objections_comment: str(row[COL.OBJ_COMMENT]),
          hearing_date: parseExcelDate(row[COL.HEARING]),
          approval_date: parseExcelDate(row[COL.APPROVAL]),
          bulk_services_amount: num(row[COL.BULK_AMOUNT]),
          bulk_services_payment_date: parseExcelDate(row[COL.BULK_PAID]),
          bulk_services_submitted_to_council: parseExcelDate(row[COL.BULK_COUNCIL]),
          proof_of_payment_fines: parseExcelDate(row[COL.PROOF_FINES]),
          final_maps_submitted: parseExcelDate(row[COL.MAPS_SUBMITTED]),
          final_maps_approved: parseExcelDate(row[COL.MAPS_APPROVED]),
          rrc_date: parseExcelDate(row[COL.RRC_DATE]),
          proclamation_date: parseExcelDate(row[COL.PROCLAMATION]),
          consent_70_70_received: parseExcelDate(row[COL.CONSENT_70]),
          sanral_comments: str(row[COL.SANRAL]),
          sr_progress: str(row[COL.SR_PROGRESS]) || str(row[COL.SR_PROGRESS2]),
          client_progress_sent: parseExcelDate(row[COL.CLIENT_PROGRESS]),
        })
        .select('id')
        .single()

      if (projError) {
        errors.push(`${fileNumber}: ${projError.message}`)
        continue
      }

      if (project) {
        // Create department comments
        const deptMapping = [
          { col: COL.DEPT_ELEC, key: 'electricity' },
          { col: COL.DEPT_WS, key: 'water_sewer' },
          { col: COL.DEPT_RS, key: 'roads_stormwater' },
          { col: COL.DEPT_ENV, key: 'environmental' },
          { col: COL.DEPT_BUILD, key: 'building_control' },
          { col: COL.DEPT_TP, key: 'town_planning' },
        ]

        await supabase.from('department_comments').insert(
          deptMapping.map((dept) => ({
            project_id: project.id,
            department: dept.key,
            status: String(row[dept.col] || '').toLowerCase() === 'x' ? 'received' : 'pending',
          }))
        )

        // Create invoice if present
        const invAmount = num(row[COL.INV_AMOUNT])
        if (invAmount) {
          await supabase.from('invoices').insert({
            project_id: project.id,
            invoice_number: str(row[COL.INV_NUMBER]),
            amount: invAmount,
            amount_paid: num(row[COL.AMOUNT_PAID]) || 0,
            payment_notes: str(row[COL.PAYMENT_NOTES]),
          })
        }

        // Add notes if present
        const notes = str(row[COL.NOTES])
        if (notes) {
          await supabase.from('project_notes').insert({
            project_id: project.id,
            author_id: user.id,
            content: notes,
          })
        }

        imported++
      }
    } catch (err) {
      errors.push(`${fileNumber}: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  return NextResponse.json({
    imported,
    skipped,
    errors: errors.slice(0, 20),
    totalRows: dataRows.length,
  })
}
