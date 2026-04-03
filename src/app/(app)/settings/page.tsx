import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { MunicipalitiesManager } from '@/components/settings/municipalities-manager'
import { ApplicationTypesManager } from '@/components/settings/application-types-manager'
import { DepartmentsManager } from '@/components/settings/departments-manager'

export default async function SettingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [{ data: profile }, { data: municipalities }, { data: applicationTypes }, { data: departments }] =
    await Promise.all([
      supabase.from('profiles').select('*').eq('id', user?.id).single(),
      supabase.from('municipalities').select('*').order('name'),
      supabase.from('application_types').select('*').order('sort_order'),
      supabase.from('departments').select('*').order('sort_order'),
    ])

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Manage reference data and your profile
        </p>
      </div>

      {/* Profile */}
      <Card className="border-border/40 shadow-sm">
        <CardHeader>
          <CardTitle className="text-[15px] font-semibold">Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-[13px]">
            <span className="text-muted-foreground">Name</span>
            <span className="font-medium">{profile?.full_name || '-'}</span>
          </div>
          <div className="flex justify-between text-[13px]">
            <span className="text-muted-foreground">Email</span>
            <span className="font-medium">{profile?.email || user?.email || '-'}</span>
          </div>
          <div className="flex justify-between text-[13px]">
            <span className="text-muted-foreground">Title</span>
            <span className="font-medium">{profile?.title || '-'}</span>
          </div>
          <div className="flex justify-between text-[13px]">
            <span className="text-muted-foreground">Role</span>
            <span className="font-medium capitalize">{profile?.role || '-'}</span>
          </div>
        </CardContent>
      </Card>

      {/* Municipalities */}
      <Card className="border-border/40 shadow-sm">
        <CardHeader>
          <CardTitle className="text-[15px] font-semibold">Municipalities</CardTitle>
          <CardDescription className="text-[13px]">
            Local municipalities used when creating projects.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MunicipalitiesManager initial={municipalities ?? []} />
        </CardContent>
      </Card>

      {/* Application Types */}
      <Card className="border-border/40 shadow-sm">
        <CardHeader>
          <CardTitle className="text-[15px] font-semibold">Application Types</CardTitle>
          <CardDescription className="text-[13px]">
            Types of land-use applications that can be assigned to projects.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ApplicationTypesManager initial={applicationTypes ?? []} />
        </CardContent>
      </Card>

      {/* Departments */}
      <Card className="border-border/40 shadow-sm">
        <CardHeader>
          <CardTitle className="text-[15px] font-semibold">Departments</CardTitle>
          <CardDescription className="text-[13px]">
            Municipal departments that review applications at Step 3.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DepartmentsManager initial={departments ?? []} />
        </CardContent>
      </Card>

      {/* About */}
      <Card className="border-border/40 shadow-sm">
        <CardHeader>
          <CardTitle className="text-[15px] font-semibold">About</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-[13px] text-muted-foreground">
          <p>Korsman Town & Regional Planners</p>
          <p>14 Bethal Street, Modelpark, Emalahleni, 1035</p>
          <p>Phone: 013 650 0408</p>
          <p>Email: admin@korsman.co.za</p>
        </CardContent>
      </Card>
    </div>
  )
}
