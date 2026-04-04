export type UserRole = 'admin' | 'planner' | 'viewer'

export type ProjectStatus = 'active' | 'approved' | 'cancelled' | 'not_approved' | 'on_hold'

export type DepartmentName =
  | 'electricity'
  | 'water_sewer'
  | 'roads_stormwater'
  | 'environmental'
  | 'building_control'
  | 'town_planning'

export type DepartmentCommentStatus = 'pending' | 'requested' | 'received'

export interface Profile {
  id: string
  full_name: string
  title: string | null
  role: UserRole
  email: string | null
  created_at: string
  updated_at: string
}

export interface Municipality {
  id: string
  name: string
  code: string
  province: string | null
  created_at: string
}

export interface ApplicationType {
  id: string
  name: string
  description: string | null
  sort_order: number
}

export interface Client {
  id: string
  name: string
  phone_landline: string | null
  phone_cell: string | null
  email: string | null
  postal_address: string | null
  physical_address: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  file_number: string
  portal_reference: string | null
  scheme_number: string | null
  sp_number: string | null
  application_type_id: string | null
  municipality_id: string | null
  client_id: string | null
  legal_description: string | null
  physical_address: string | null
  present_zoning: string | null
  zoning_applied_for: string | null
  current_step: number
  status: ProjectStatus
  legal_status: string | null
  quotation_number: string | null
  quotation_date: string | null
  quotation_amount: number | null
  date_accepting: string | null
  application_submission_date: string | null
  proof_of_ads_date: string | null
  bondholder_consent_requested: string | null
  bondholder_consent_received: string | null
  bondholder_consent_submitted: string | null
  objections: boolean
  objections_comment: string | null
  hearing_date: string | null
  approval_date: string | null
  bulk_services_amount: number | null
  bulk_services_payment_date: string | null
  bulk_services_submitted_to_council: string | null
  proof_of_payment_fines: string | null
  final_maps_submitted: string | null
  final_maps_approved: string | null
  rrc_date: string | null
  proclamation_date: string | null
  consent_70_70_received: string | null
  consent_type: string | null
  sanral_comments: string | null
  sr_progress: string | null
  client_progress_sent: string | null
  assigned_planner_id: string | null
  created_at: string
  updated_at: string
  // Joined relations
  client?: Client
  application_type?: ApplicationType
  municipality?: Municipality
  assigned_planner?: Profile
  department_comments?: DepartmentComment[]
}

export interface DepartmentComment {
  id: string
  project_id: string
  department: DepartmentName
  status: DepartmentCommentStatus
  requested_date: string | null
  received_date: string | null
  comments: string | null
  has_issue: boolean
  issue_notes: string | null
  issue_assigned_to: string | null
  issue_assignee?: { full_name: string; title: string | null }
}

export interface ProjectNote {
  id: string
  project_id: string
  author_id: string | null
  content: string
  created_at: string
  author?: Profile
}

export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'declined'

export interface Quotation {
  id: string
  project_id: string
  quotation_number: string | null
  amount: number
  date_issued: string | null
  status: QuoteStatus
  date_accepted: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Invoice {
  id: string
  project_id: string
  invoice_number: string | null
  amount: number
  date_issued: string | null
  amount_paid: number
  payment_notes: string | null
  created_at: string
  payments?: Payment[]
}

export interface Payment {
  id: string
  invoice_id: string
  amount: number
  payment_date: string | null
  reference: string | null
  notes: string | null
  created_at: string
}

export interface ProgressReport {
  id: string
  project_id: string
  report_number: number
  generated_by: string | null
  narrative: string | null
  pdf_storage_path: string | null
  created_at: string
}

// Application step labels - standard SPLUMA process
export const APPLICATION_STEPS = [
  { step: 1, label: 'Filed', description: 'Application sent to Department of Town Planning' },
  { step: 2, label: 'Public Participation', description: 'Council informs office that public participation may start' },
  { step: 3, label: 'Department Comments', description: 'Application circulates for departmental comments' },
  { step: 4, label: 'Town Planning Review', description: 'Returns to Town Planning for final report' },
  { step: 5, label: 'Admin Review', description: 'Final report sent to Spatial Planning Administrator' },
  { step: 6, label: 'Council Sign-off', description: 'Council Resolution drafted and signed' },
  { step: 7, label: 'Resolution Issued', description: 'Council Resolution is issued' },
] as const

// Township Establishment follows a different process
export const TOWNSHIP_STEPS = [
  { step: 1, label: 'Preparation', description: 'Preparation of application documentation and reports' },
  { step: 2, label: 'Submission', description: 'Application submitted to the municipality' },
  { step: 3, label: 'Assessment', description: 'Municipal assessment and departmental comments' },
  { step: 4, label: 'Decision', description: 'Municipality makes a decision on the application' },
  { step: 5, label: 'Compliance', description: 'Compliance with conditions of establishment' },
  { step: 6, label: 'Registration', description: 'Township register opened at Surveyor-General' },
  { step: 7, label: 'Proclamation', description: 'Township proclaimed in the Provincial Gazette' },
] as const

export type ApplicationStep = { step: number; label: string; description: string }

export function getApplicationSteps(applicationTypeName: string | null | undefined): ApplicationStep[] {
  if (applicationTypeName === 'Township Establishment') {
    return [...TOWNSHIP_STEPS]
  }
  return [...APPLICATION_STEPS]
}

export const DEPARTMENTS: { key: DepartmentName; label: string }[] = [
  { key: 'town_planning', label: 'Town Planning' },
  { key: 'electricity', label: 'Electricity' },
  { key: 'water_sewer', label: 'Water & Sewer' },
  { key: 'roads_stormwater', label: 'Roads & Storm Water' },
  { key: 'environmental', label: 'Environmental Affairs' },
  { key: 'building_control', label: 'Building Control' },
]

export const PROJECT_STATUSES: { value: ProjectStatus; label: string; color: string }[] = [
  { value: 'active', label: 'Active', color: 'bg-blue-50 text-blue-700 border-blue-100' },
  { value: 'approved', label: 'Approved', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  { value: 'on_hold', label: 'On Hold', color: 'bg-amber-50 text-amber-700 border-amber-100' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-50 text-red-600 border-red-100' },
  { value: 'not_approved', label: 'Not Approved', color: 'bg-slate-100 text-slate-600 border-slate-200' },
]
