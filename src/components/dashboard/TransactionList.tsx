'use client'

import * as React from 'react'
import { ArrowDownRight, ArrowUpRight, ShoppingCart, Coffee, Home, Plane } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { formatCurrency, formatDate } from '@/lib/utils'

const transactions = [
  {
    id: '1',
    description: 'Supermarket Shopping',
    amount: -156.80,
    date: new Date('2025-10-18'),
    category: 'Groceries',
    icon: ShoppingCart,
  },
  {
    id: '2',
    description: 'Salary Deposit',
    amount: 4500.00,
    date: new Date('2025-10-15'),
    category: 'Income',
    icon: ArrowUpRight,
  },
  {
    id: '3',
    description: 'Coffee Shop',
    amount: -12.50,
    date: new Date('2025-10-14'),
    category: 'Food & Drink',
    icon: Coffee,
  },
  {
    id: '4',
    description: 'Rent Payment',
    amount: -1200.00,
    date: new Date('2025-10-01'),
    category: 'Housing',
    icon: Home,
  },
  {
    id: '5',
    description: 'Flight Booking',
    amount: -450.00,
    date: new Date('2025-09-28'),
    category: 'Travel',
    icon: Plane,
  },
]

export function TransactionList() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription className="mt-1.5">
            Your latest financial activity
          </CardDescription>
        </div>
        <Button variant="outline" size="sm">
          View All
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.map((transaction) => {
            const Icon = transaction.icon
            const isIncome = transaction.amount > 0

            return (
              <div
                key={transaction.id}
                className="flex items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-accent/50"
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    isIncome ? 'bg-green-100' : 'bg-muted'
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 ${
                      isIncome ? 'text-green-600' : 'text-muted-foreground'
                    }`}
                  />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{transaction.description}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <p className="text-xs text-muted-foreground">
                      {transaction.category}
                    </p>
                    <span className="text-xs text-muted-foreground">•</span>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(transaction.date)}
                    </p>
                  </div>
                </div>
                <p
                  className={`text-lg font-semibold ${
                    isIncome ? 'text-green-600' : 'text-foreground'
                  }`}
                >
                  {isIncome ? '+' : ''}
                  {formatCurrency(transaction.amount)}
                </p>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
