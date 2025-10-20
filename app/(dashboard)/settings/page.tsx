'use client'

import { Card } from '@/components/ui/Card'

export default function SettingsPage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Einstellungen</h1>

      <Card>
        <Card.Header>
          <Card.Title>Allgemeine Einstellungen</Card.Title>
          <Card.Description>
            Verwalten Sie Ihre Kontoeinstellungen und Präferenzen
          </Card.Description>
        </Card.Header>
        <Card.Content>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                E-Mail-Benachrichtigungen
              </label>
              <input
                type="checkbox"
                className="rounded"
                defaultChecked
              />
              <span className="ml-2 text-sm text-gray-600">
                Bei neuen Transaktionen benachrichtigen
              </span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sprache
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                <option>Deutsch</option>
                <option>English</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Zeitzone
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                <option>Europe/Berlin</option>
                <option>Europe/London</option>
              </select>
            </div>
          </div>
        </Card.Content>
      </Card>
    </div>
  )
}
