import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from '@react-pdf/renderer'
import { getApplicationSteps } from '@/types'
import path from 'path'

const colors = {
  maroon: '#7B1A3A',
  grey: '#808080',
  lightGrey: '#E5E5E5',
  green: '#4CAF50',
  blue: '#2196F3',
  darkText: '#333333',
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: colors.darkText,
  },
  // Header
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  logo: {
    width: 180,
    height: 90,
  },
  companyInfo: {
    textAlign: 'right',
    fontSize: 8,
    color: colors.grey,
  },
  companyInfoLine: {
    marginBottom: 2,
  },
  // Divider
  divider: {
    borderBottomWidth: 2,
    borderBottomColor: colors.maroon,
    marginVertical: 10,
  },
  thinDivider: {
    borderBottomWidth: 0.5,
    borderBottomColor: colors.lightGrey,
    marginVertical: 8,
  },
  // Title
  title: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: colors.maroon,
    marginBottom: 15,
    textAlign: 'center',
  },
  // About table
  aboutTable: {
    marginBottom: 20,
  },
  aboutRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: colors.lightGrey,
    paddingVertical: 4,
  },
  aboutLabel: {
    width: 140,
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    color: colors.grey,
  },
  aboutValue: {
    flex: 1,
    fontSize: 9,
  },
  // Section
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: colors.maroon,
    marginTop: 15,
    marginBottom: 8,
  },
  // Step tracker
  stepsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 15,
    paddingHorizontal: 10,
  },
  stepItem: {
    alignItems: 'center',
    width: 60,
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  stepCircleComplete: {
    backgroundColor: colors.green,
  },
  stepCircleCurrent: {
    backgroundColor: colors.blue,
  },
  stepCircleFuture: {
    backgroundColor: colors.lightGrey,
  },
  stepNumber: {
    color: 'white',
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
  },
  stepNumberFuture: {
    color: colors.grey,
    fontSize: 10,
  },
  checkmark: {
    color: 'white',
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
  },
  stepLabel: {
    fontSize: 6,
    textAlign: 'center',
    color: colors.grey,
    maxWidth: 60,
  },
  stepLine: {
    flex: 1,
    height: 2,
    marginBottom: 16,
  },
  stepLineComplete: {
    backgroundColor: colors.green,
  },
  stepLineIncomplete: {
    backgroundColor: colors.lightGrey,
  },
  // Narrative
  narrative: {
    fontSize: 10,
    lineHeight: 1.6,
    marginTop: 10,
    textAlign: 'justify',
  },
  // Department table
  deptTable: {
    marginTop: 10,
  },
  deptHeader: {
    flexDirection: 'row',
    backgroundColor: colors.maroon,
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  deptHeaderText: {
    color: 'white',
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
  },
  deptRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: colors.lightGrey,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  deptName: {
    width: 180,
    fontSize: 8,
  },
  deptStatus: {
    width: 80,
    fontSize: 8,
  },
  deptDate: {
    flex: 1,
    fontSize: 8,
  },
  // Signature
  signatureSection: {
    marginTop: 40,
    alignItems: 'flex-left' as 'flex-start',
  },
  signatureImage: {
    width: 100,
    height: 60,
  },
  signatureName: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    marginTop: 4,
  },
  signatureTitle: {
    fontSize: 8,
    color: colors.grey,
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 25,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: colors.maroon,
    paddingTop: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 7,
    color: colors.grey,
  },
})

interface ReportData {
  reportNumber: number
  reportDate: string
  project: {
    file_number: string
    portal_reference: string | null
    scheme_number: string | null
    current_step: number
    legal_description: string | null
    physical_address: string | null
    present_zoning: string | null
    zoning_applied_for: string | null
    application_submission_date: string | null
  }
  applicationType: string | null
  municipality: { name: string; code: string } | null
  client: { name: string } | null
  planner: { full_name: string; title: string | null } | null
  departments: { department: string; status: string; requested_date: string | null; received_date: string | null }[]
  narrative: string
  logoPath: string
  signaturePath: string
}

const DEPT_LABELS: Record<string, string> = {
  town_planning: 'Town Planning',
  electricity: 'Electricity',
  water_sewer: 'Water & Sewer',
  roads_stormwater: 'Roads & Storm Water',
  environmental: 'Environmental Affairs',
  building_control: 'Building Control',
}

function formatDateSA(dateStr: string | null): string {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`
}

export function ProgressReportDocument({ data }: { data: ReportData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header with logo and company info */}
        <View style={styles.headerContainer}>
          <Image style={styles.logo} src={data.logoPath} />
          <View style={styles.companyInfo}>
            <Text style={styles.companyInfoLine}>KORSMAN & ASSOCIATES</Text>
            <Text style={styles.companyInfoLine}>Town & Regional Planners</Text>
            <Text style={styles.companyInfoLine}>14 Bethal Street, Modelpark</Text>
            <Text style={styles.companyInfoLine}>Emalahleni, 1035</Text>
            <Text style={styles.companyInfoLine}>Tel: 013 650 0408</Text>
            <Text style={styles.companyInfoLine}>Email: admin@korsman.co.za</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Title */}
        <Text style={styles.title}>PROGRESS REPORT</Text>

        {/* About Project table */}
        <View style={styles.aboutTable}>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>Date</Text>
            <Text style={styles.aboutValue}>{data.reportDate}</Text>
          </View>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>Report Number</Text>
            <Text style={styles.aboutValue}>{data.reportNumber}</Text>
          </View>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>File Reference</Text>
            <Text style={styles.aboutValue}>{data.project.file_number}</Text>
          </View>
          {data.project.portal_reference && (
            <View style={styles.aboutRow}>
              <Text style={styles.aboutLabel}>Portal Reference</Text>
              <Text style={styles.aboutValue}>{data.project.portal_reference}</Text>
            </View>
          )}
          {data.municipality && (
            <View style={styles.aboutRow}>
              <Text style={styles.aboutLabel}>Municipality</Text>
              <Text style={styles.aboutValue}>{data.municipality.code} - {data.municipality.name}</Text>
            </View>
          )}
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>Application Type</Text>
            <Text style={styles.aboutValue}>{data.applicationType || '-'}</Text>
          </View>
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>Client</Text>
            <Text style={styles.aboutValue}>{data.client?.name || '-'}</Text>
          </View>
          {data.project.legal_description && (
            <View style={styles.aboutRow}>
              <Text style={styles.aboutLabel}>Property</Text>
              <Text style={styles.aboutValue}>{data.project.legal_description}</Text>
            </View>
          )}
          {data.project.present_zoning && (
            <View style={styles.aboutRow}>
              <Text style={styles.aboutLabel}>Present Zoning</Text>
              <Text style={styles.aboutValue}>{data.project.present_zoning}</Text>
            </View>
          )}
          {data.project.zoning_applied_for && (
            <View style={styles.aboutRow}>
              <Text style={styles.aboutLabel}>Zoning Applied For</Text>
              <Text style={styles.aboutValue}>{data.project.zoning_applied_for}</Text>
            </View>
          )}
        </View>

        <View style={styles.thinDivider} />

        {/* Step Tracker */}
        <Text style={styles.sectionTitle}>Application Progress</Text>
        <View style={styles.stepsContainer}>
          {getApplicationSteps(data.applicationType).map((step, index, arr) => (
            <React.Fragment key={step.step}>
              <View style={styles.stepItem}>
                <View
                  style={[
                    styles.stepCircle,
                    step.step < data.project.current_step
                      ? styles.stepCircleComplete
                      : step.step === data.project.current_step
                      ? styles.stepCircleCurrent
                      : styles.stepCircleFuture,
                  ]}
                >
                  {step.step < data.project.current_step ? (
                    <Text style={styles.checkmark}>✓</Text>
                  ) : (
                    <Text
                      style={
                        step.step <= data.project.current_step
                          ? styles.stepNumber
                          : styles.stepNumberFuture
                      }
                    >
                      {step.step}
                    </Text>
                  )}
                </View>
                <Text style={styles.stepLabel}>{step.label}</Text>
              </View>
              {index < arr.length - 1 && (
                <View
                  style={[
                    styles.stepLine,
                    step.step < data.project.current_step
                      ? styles.stepLineComplete
                      : styles.stepLineIncomplete,
                  ]}
                />
              )}
            </React.Fragment>
          ))}
        </View>

        <View style={styles.thinDivider} />

        {/* Department Comments */}
        {data.departments.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Department Comments Status</Text>
            <View style={styles.deptTable}>
              <View style={styles.deptHeader}>
                <Text style={[styles.deptHeaderText, { width: 180 }]}>Department</Text>
                <Text style={[styles.deptHeaderText, { width: 80 }]}>Status</Text>
                <Text style={[styles.deptHeaderText, { flex: 1 }]}>Date</Text>
              </View>
              {data.departments.map((dept) => (
                <View key={dept.department} style={styles.deptRow}>
                  <Text style={styles.deptName}>{DEPT_LABELS[dept.department] || dept.department}</Text>
                  <Text style={styles.deptStatus}>
                    {dept.status.charAt(0).toUpperCase() + dept.status.slice(1)}
                  </Text>
                  <Text style={styles.deptDate}>
                    {dept.status === 'received'
                      ? formatDateSA(dept.received_date)
                      : dept.status === 'requested'
                      ? formatDateSA(dept.requested_date)
                      : '-'}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

        <View style={styles.thinDivider} />

        {/* Narrative */}
        <Text style={styles.sectionTitle}>Report</Text>
        <Text style={styles.narrative}>{data.narrative}</Text>

        {/* Signature */}
        <View style={styles.signatureSection}>
          <Image style={styles.signatureImage} src={data.signaturePath} />
          <Text style={styles.signatureName}>
            {data.planner?.full_name || 'Laurette Swarts'}
          </Text>
          <Text style={styles.signatureTitle}>
            {data.planner?.title || 'Pr. Pln'}
          </Text>
          <Text style={styles.signatureTitle}>Korsman & Associates</Text>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>Korsman & Associates - Town & Regional Planners</Text>
          <Text>Report #{data.reportNumber} - {data.project.file_number}</Text>
        </View>
      </Page>
    </Document>
  )
}
