'use client'

import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default function InvoicesPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Rechnungen</h1>
        <Button onClick={() => console.log('Neue Rechnung')}>
          Neue Rechnung
        </Button>
      </div>

      <Card>
        <Card.Header>
          <Card.Title>Rechnungsverwaltung</Card.Title>
          <Card.Description>
            Verwaltung von Mitgliederrechnungen und Zahlungsstatus
          </Card.Description>
        </Card.Header>
        <Card.Content>
          <p className="text-gray-600">
            Rechnungsmodul wird hier implementiert...
          </p>
        </Card.Content>
      </Card>
    </div>
  )
}
