'use client'

import { Card } from '@/components/ui/Card'
import { useEffect, useState } from 'react'

interface DashboardStats {
  totalMembers: number
  activeMembers: number
  totalBalance: number
  monthlyIncome: number
  monthlyExpenses: number
}

export function VereinDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // TODO: Fetch real data from API
    setStats({
      totalMembers: 125,
      activeMembers: 118,
      totalBalance: 45230.50,
      monthlyIncome: 3450.00,
      monthlyExpenses: 2180.75
    })
    setLoading(false)
  }, [])

  if (loading) {
    return <div className="p-6">Lade Dashboard...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Vereins-Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <Card.Header>
            <Card.Title>Mitglieder gesamt</Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="text-3xl font-bold">{stats?.totalMembers}</div>
            <p className="text-sm text-gray-600">
              {stats?.activeMembers} aktive Mitglieder
            </p>
          </Card.Content>
        </Card>

        <Card>
          <Card.Header>
            <Card.Title>Kontosaldo</Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="text-3xl font-bold text-green-600">
              {stats?.totalBalance.toLocaleString('de-DE', {
                style: 'currency',
                currency: 'EUR'
              })}
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Header>
            <Card.Title>Einnahmen (Monat)</Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="text-3xl font-bold text-green-600">
              {stats?.monthlyIncome.toLocaleString('de-DE', {
                style: 'currency',
                currency: 'EUR'
              })}
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Header>
            <Card.Title>Ausgaben (Monat)</Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="text-3xl font-bold text-red-600">
              {stats?.monthlyExpenses.toLocaleString('de-DE', {
                style: 'currency',
                currency: 'EUR'
              })}
            </div>
          </Card.Content>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <Card.Header>
            <Card.Title>Letzte Buchungen</Card.Title>
          </Card.Header>
          <Card.Content>
            <p className="text-gray-600">Buchungshistorie wird hier angezeigt...</p>
          </Card.Content>
        </Card>

        <Card>
          <Card.Header>
            <Card.Title>Fällige Beiträge</Card.Title>
          </Card.Header>
          <Card.Content>
            <p className="text-gray-600">Offene Mitgliedsbeiträge werden hier angezeigt...</p>
          </Card.Content>
        </Card>
      </div>
    </div>
  )
}
