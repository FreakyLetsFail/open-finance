'use client'

import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default function ReceiptsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Belege</h1>
        <Button onClick={() => console.log('Neuer Beleg')}>
          Beleg einreichen
        </Button>
      </div>

      <Card>
        <Card.Header>
          <Card.Title>Belegverwaltung</Card.Title>
          <Card.Description>
            Einreichung und Genehmigung von Ausgabenbelegen
          </Card.Description>
        </Card.Header>
        <Card.Content>
          <p className="text-gray-600">
            Belegverwaltung wird hier implementiert...
          </p>
        </Card.Content>
      </Card>
    </div>
  )
}
