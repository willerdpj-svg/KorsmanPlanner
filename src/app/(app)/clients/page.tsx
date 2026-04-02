import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Phone, Mail } from 'lucide-react'

export default async function ClientsPage() {
  const supabase = await createClient()

  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .order('name')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
        <Link href="/clients/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Client
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
          {clients && clients.length > 0 ? (
            <div className="divide-y">
              {clients.map((client) => (
                <Link
                  key={client.id}
                  href={`/clients/${client.id}`}
                  className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-muted/50"
                >
                  <div>
                    <p className="font-medium">{client.name}</p>
                    <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
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
            <p className="py-12 text-center text-sm text-muted-foreground">
              No clients yet. Add your first client to get started.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
