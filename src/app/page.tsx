'use client'

import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { StatsCards } from '@/components/dashboard/StatsCards'
import { TransactionList } from '@/components/dashboard/TransactionList'
import { BudgetOverview } from '@/components/dashboard/BudgetOverview'
import { SpendingChart } from '@/components/dashboard/SpendingChart'

export default function HomePage() {
  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back! Here's your financial overview.
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <StatsCards />

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-7">
          {/* Spending Chart */}
          <div className="lg:col-span-4">
            <SpendingChart />
          </div>

          {/* Budget Overview */}
          <div className="lg:col-span-3">
            <BudgetOverview />
          </div>
        </div>

        {/* Recent Transactions */}
        <TransactionList />
      </div>
    </DashboardLayout>
  )
}
