"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend } from "recharts"

interface AdminChartsProps {
  data: {
    topSellers: { name: string; value: number }[]
    salesHistory: { date: string; sales: number }[]
    monthlyProgress: { current: number; goal: number; percentage: number }
    topProducts?: { name: string; quantity: number; revenue: number }[]
  }
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export function AdminCharts({ data }: AdminChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      {/* Sales History - Bar Chart */}
      <Card className="col-span-1 lg:col-span-2">
        <CardHeader>
          <CardTitle>Sales History (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.salesHistory}>
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => new Date(value).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' })}
                fontSize={12}
              />
              <YAxis 
                fontSize={12}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip 
                formatter={(value: number) => [`$${value.toFixed(2)}`, "Sales"]}
                labelFormatter={(label) => new Date(label).toLocaleDateString()}
              />
              <Bar dataKey="sales" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Sellers - Donut Chart */}
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle>Top Sellers</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data.topSellers}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="value"
              >
                {data.topSellers.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, "Sales"]} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Products - List */}
      <Card className="col-span-1">
        <CardHeader>
          <CardTitle>Top Selling Products</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.topProducts && data.topProducts.length > 0 ? (
              data.topProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between border-b pb-2 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{product.name}</p>
                      <p className="text-xs text-gray-500">{product.quantity} units sold</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">R$ {product.revenue.toFixed(2)}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No sales data available yet.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Monthly Goal - Progress Bar */}
      <Card className="col-span-1 lg:col-span-2">
        <CardHeader>
          <CardTitle>Monthly Sales Goal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Current: ${data.monthlyProgress.current.toFixed(2)}</span>
              <span className="text-muted-foreground">Goal: ${data.monthlyProgress.goal.toFixed(2)}</span>
            </div>
            <Progress value={data.monthlyProgress.percentage} className="h-4" />
            <p className="text-xs text-muted-foreground text-right">{data.monthlyProgress.percentage}% achieved</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
