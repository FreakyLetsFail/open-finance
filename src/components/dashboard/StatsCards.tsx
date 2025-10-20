'use client'

import * as React from 'react'
import { TrendingUp, TrendingDown, Wallet, CreditCard, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { formatCurrency } from '@/lib/utils'

const stats = [
  {
    title: 'Total Balance',
    value: 45650.25,
    change: 12.5,
    trend: 'up' as const,
    icon: Wallet,
  },
  {
    title: 'Monthly Income',
    value: 8500.00,
    change: 8.2,
    trend: 'up' as const,
    icon: TrendingUp,
  },
  {
    title: 'Monthly Expenses',
    value: 4235.80,
    change: -3.1,
    trend: 'down' as const,
    icon: TrendingDown,
  },
  {
    title: 'Credit Cards',
    value: 1250.50,
    change: 5.4,
    trend: 'up' as const,
    icon: CreditCard,
  },
]

export function StatsCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon
        const TrendIcon = stat.trend === 'up' ? ArrowUpRight : ArrowDownRight

        return (
          <Card key={stat.title} className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <div
                  className={`flex items-center gap-1 text-sm font-medium ${
                    stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  <TrendIcon className="h-4 w-4" />
                  {Math.abs(stat.change)}%
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </p>
                <p className="mt-1 text-2xl font-bold">
                  {formatCurrency(stat.value)}
                </p>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
