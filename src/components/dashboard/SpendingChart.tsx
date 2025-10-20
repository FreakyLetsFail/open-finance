'use client'

import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'

const monthlyData = [
  { month: 'Jan', income: 4500, expenses: 3200 },
  { month: 'Feb', income: 4500, expenses: 3400 },
  { month: 'Mar', income: 4500, expenses: 3100 },
  { month: 'Apr', income: 5000, expenses: 3500 },
  { month: 'May', income: 4500, expenses: 3300 },
  { month: 'Jun', income: 4800, expenses: 3600 },
]

export function SpendingChart() {
  const maxValue = Math.max(
    ...monthlyData.map((d) => Math.max(d.income, d.expenses))
  )

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Income vs Expenses</CardTitle>
        <CardDescription>Monthly comparison over the last 6 months</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Legend */}
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-green-500" />
              <span>Income</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-red-500" />
              <span>Expenses</span>
            </div>
          </div>

          {/* Simple Bar Chart */}
          <div className="flex h-64 items-end justify-between gap-3">
            {monthlyData.map((data) => (
              <div key={data.month} className="flex flex-1 flex-col gap-2">
                <div className="flex flex-1 flex-col justify-end gap-1">
                  {/* Income Bar */}
                  <div
                    className="w-full rounded-t bg-green-500 transition-all hover:bg-green-600"
                    style={{ height: `${(data.income / maxValue) * 100}%` }}
                    title={`Income: €${data.income}`}
                  />
                  {/* Expenses Bar */}
                  <div
                    className="w-full rounded-b bg-red-500 transition-all hover:bg-red-600"
                    style={{ height: `${(data.expenses / maxValue) * 100}%` }}
                    title={`Expenses: €${data.expenses}`}
                  />
                </div>
                <p className="text-center text-xs text-muted-foreground">
                  {data.month}
                </p>
              </div>
            ))}
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 border-t pt-4">
            <div>
              <p className="text-xs text-muted-foreground">Avg Income</p>
              <p className="mt-1 text-lg font-semibold text-green-600">
                €{Math.round(monthlyData.reduce((acc, d) => acc + d.income, 0) / monthlyData.length)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Avg Expenses</p>
              <p className="mt-1 text-lg font-semibold text-red-600">
                €{Math.round(monthlyData.reduce((acc, d) => acc + d.expenses, 0) / monthlyData.length)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Avg Savings</p>
              <p className="mt-1 text-lg font-semibold text-primary">
                €{Math.round(monthlyData.reduce((acc, d) => acc + (d.income - d.expenses), 0) / monthlyData.length)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
