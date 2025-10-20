'use client'

import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { formatCurrency, formatPercent } from '@/lib/utils'

const budgets = [
  {
    category: 'Groceries',
    spent: 450,
    limit: 600,
    color: 'bg-blue-500',
  },
  {
    category: 'Transportation',
    spent: 180,
    limit: 200,
    color: 'bg-green-500',
  },
  {
    category: 'Entertainment',
    spent: 320,
    limit: 300,
    color: 'bg-red-500',
  },
  {
    category: 'Utilities',
    spent: 150,
    limit: 250,
    color: 'bg-yellow-500',
  },
]

export function BudgetOverview() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Budget Overview</CardTitle>
        <CardDescription>Track your spending by category</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {budgets.map((budget) => {
            const percentage = (budget.spent / budget.limit) * 100
            const isOverBudget = percentage > 100

            return (
              <div key={budget.category} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{budget.category}</span>
                  <span className="text-muted-foreground">
                    {formatCurrency(budget.spent)} / {formatCurrency(budget.limit)}
                  </span>
                </div>
                <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full transition-all ${
                      isOverBudget ? 'bg-red-500' : budget.color
                    }`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span
                    className={isOverBudget ? 'text-red-600 font-medium' : 'text-muted-foreground'}
                  >
                    {percentage.toFixed(1)}% used
                  </span>
                  {isOverBudget && (
                    <span className="text-red-600 font-medium">
                      Over by {formatCurrency(budget.spent - budget.limit)}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
