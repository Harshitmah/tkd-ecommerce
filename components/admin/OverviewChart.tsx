import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar
} from 'recharts'

const data = [
  { name: 'Jan', total: 2400 },
  { name: 'Feb', total: 1398 },
  { name: 'Mar', total: 9800 },
  { name: 'Apr', total: 3908 },
  { name: 'May', total: 4800 },
  { name: 'Jun', total: 3800 },
  { name: 'Jul', total: 4300 },
]

export function OverviewChart({ data = [], type = "line" }: { data?: { name: string, total: number }[], type?: "line" | "bar" }) {
  if (type === "bar") {
    return (
      <div className="h-[350px] w-full">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#71717a', fontSize: 12 }}
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#71717a', fontSize: 12 }}
              tickFormatter={(value) => `₹${value}`}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '1px solid rgba(0,0,0,0.08)',
                borderRadius: '16px',
                fontSize: '12px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)'
              }}
              itemStyle={{ color: '#000', fontWeight: 'bold' }}
              formatter={(value) => [`₹${value}`, 'Revenue']}
            />
            <Bar 
              dataKey="total" 
              fill="var(--color-accent, #000)" 
              radius={[6, 6, 0, 0]}
              maxBarSize={50}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    )
  }

  return (
    <div className="h-[350px] w-full">
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-accent, #000)" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="var(--color-accent, #000)" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#71717a', fontSize: 12 }}
            dy={10}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#71717a', fontSize: 12 }}
            tickFormatter={(value) => `₹${value}`}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#fff', 
              border: '1px solid rgba(0,0,0,0.08)',
              borderRadius: '16px',
              fontSize: '12px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)'
            }}
            itemStyle={{ color: '#000', fontWeight: 'bold' }}
            formatter={(value) => [`₹${value}`, 'Revenue']}
          />
          <Area 
            type="monotone" 
            dataKey="total" 
            stroke="var(--color-accent, #000)" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorTotal)" 
            dot={{ r: 4, fill: "#fff", stroke: "var(--color-accent, #000)", strokeWidth: 2 }}
            activeDot={{ r: 6, fill: "var(--color-accent, #000)", stroke: "#fff", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
