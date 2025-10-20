'use client'

import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useState, useEffect } from 'react'

interface Transaction {
  id: string
  transaction_number: string
  amount: number
  currency: string
  transaction_type: 'income' | 'expense' | 'transfer'
  description: string
  transaction_date: string
  category?: {
    name: string
    code: string
  }
  member?: {
    first_name: string
    last_name: string
  }
}

export function TransactionList() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTransactions()
  }, [])

  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/transactions')
      const data = await response.json()
      setTransactions(data.data || [])
    } catch (error) {
      console.error('Fehler beim Laden der Buchungen:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="p-6">Lade Buchungen...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Buchungen</h1>
        <Button onClick={() => console.log('Neue Buchung')}>
          Neue Buchung
        </Button>
      </div>

      <Card>
        <Card.Header>
          <Card.Title>Buchungsübersicht</Card.Title>
        </Card.Header>
        <Card.Content>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Buchungsnr.</th>
                  <th className="text-left p-3">Datum</th>
                  <th className="text-left p-3">Beschreibung</th>
                  <th className="text-left p-3">Kategorie</th>
                  <th className="text-left p-3">Typ</th>
                  <th className="text-right p-3">Betrag</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-mono text-sm">{transaction.transaction_number}</td>
                    <td className="p-3">
                      {new Date(transaction.transaction_date).toLocaleDateString('de-DE')}
                    </td>
                    <td className="p-3">{transaction.description}</td>
                    <td className="p-3">
                      {transaction.category ? (
                        <span className="text-sm">
                          {transaction.category.name}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        transaction.transaction_type === 'income'
                          ? 'bg-green-100 text-green-800'
                          : transaction.transaction_type === 'expense'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {transaction.transaction_type === 'income' ? 'Einnahme' :
                         transaction.transaction_type === 'expense' ? 'Ausgabe' : 'Umbuchung'}
                      </span>
                    </td>
                    <td className={`p-3 text-right font-semibold ${
                      transaction.transaction_type === 'income' ? 'text-green-600' :
                      transaction.transaction_type === 'expense' ? 'text-red-600' :
                      'text-blue-600'
                    }`}>
                      {transaction.amount.toLocaleString('de-DE', {
                        style: 'currency',
                        currency: transaction.currency
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {transactions.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Keine Buchungen vorhanden
              </div>
            )}
          </div>
        </Card.Content>
      </Card>
    </div>
  )
}
