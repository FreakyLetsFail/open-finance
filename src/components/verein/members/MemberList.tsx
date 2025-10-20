'use client'

import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useState, useEffect } from 'react'

interface Member {
  id: string
  member_number: string
  first_name: string
  last_name: string
  email: string
  status: string
  join_date: string
}

export function MemberList() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchMembers()
  }, [])

  const fetchMembers = async () => {
    try {
      const response = await fetch('/api/members')
      const data = await response.json()
      setMembers(data.data || [])
    } catch (error) {
      console.error('Fehler beim Laden der Mitglieder:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredMembers = members.filter(member =>
    member.first_name.toLowerCase().includes(search.toLowerCase()) ||
    member.last_name.toLowerCase().includes(search.toLowerCase()) ||
    member.member_number.includes(search) ||
    member.email.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return <div className="p-6">Lade Mitglieder...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Mitgliederverwaltung</h1>
        <Button onClick={() => console.log('Neues Mitglied')}>
          Neues Mitglied
        </Button>
      </div>

      <Card>
        <Card.Header>
          <div className="flex items-center gap-4">
            <input
              type="text"
              placeholder="Mitglieder suchen..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 px-4 py-2 border rounded-lg"
            />
          </div>
        </Card.Header>
        <Card.Content>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Mitgliedsnr.</th>
                  <th className="text-left p-3">Name</th>
                  <th className="text-left p-3">E-Mail</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Beitrittsdatum</th>
                  <th className="text-left p-3">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((member) => (
                  <tr key={member.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-mono text-sm">{member.member_number}</td>
                    <td className="p-3">{member.first_name} {member.last_name}</td>
                    <td className="p-3">{member.email}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        member.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {member.status === 'active' ? 'Aktiv' : 'Inaktiv'}
                      </span>
                    </td>
                    <td className="p-3">
                      {new Date(member.join_date).toLocaleDateString('de-DE')}
                    </td>
                    <td className="p-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => console.log('Bearbeiten', member.id)}
                      >
                        Bearbeiten
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredMembers.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Keine Mitglieder gefunden
              </div>
            )}
          </div>
        </Card.Content>
      </Card>
    </div>
  )
}
