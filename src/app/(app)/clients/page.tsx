import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Phone, Mail, Users } from 'lucide-react'
import { SearchInput } from '@/components/search-input'

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('clients')
    .select('*')
    .order('name')

  if (params.search) {
    query = query.or(
      `name.ilike.%${params.search}%,email.ilike.%${params.search}%,phone_cell.ilike.%${params.search}%,physical_address.ilike.%${params.search}%`
    )
  }

  const { data: clients } = await query.limit(100)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">Clients</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {clients?.length ?? 0} client{clients?.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <Link href="/clients/new">
          <Button size="sm" className="gap-1.5 rounded-xl px-4 text-[13px] font-semibold">
            <Plus className="h-4 w-4" />
            New Client
          </Button>
        </Link>
      </div>

      <div className="max-w-sm">
        <SearchInput placeholder="Search by name, email, phone, or address…" />
      </div>

      <Card className="border-border/40 shadow-sm">
        <CardContent className="p-0">
          {clients && clients.length > 0 ? (
            <div className="divide-y divide-border/40">
              {clients.map((client) => (
                <Link
                  key={client.id}
                  href={`/clients/${client.id}`}
                  className="flex items-center justify-between px-5 py-4 transition-all hover:bg-muted/20"
                >
                  <div>
                    <p className="text-[13px] font-semibold">{client.name}</p>
                    <div className="mt-1 flex items-center gap-4 text-[12px] text-muted-foreground">
                      {client.phone_cell && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {client.phone_cell}
                        </span>
                      )}
                      {client.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {client.email}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-20 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/50">
                <Users className="h-7 w-7 text-muted-foreground/30" />
              </div>
              <p className="mt-4 text-[14px] font-medium text-muted-foreground">
                {params.search ? 'No clients match your search' : 'No clients yet'}
              </p>
              <p className="mt-1 text-[13px] text-muted-foreground/60">
                {params.search
                  ? 'Try adjusting your search terms.'
                  : 'Add your first client to get started.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
