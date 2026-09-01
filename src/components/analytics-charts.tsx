'use client';

import React from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

interface ChartDataProps {
  hourlyTurnout: { hour: string; votes: number }[];
  deptParticipation: { name: string; participation: number; total: number }[];
  deviceBreakdown: { name: string; value: number }[];
}

export function AnalyticsCharts({ hourlyTurnout, deptParticipation, deviceBreakdown }: ChartDataProps) {
  // Purple theme gradient colors
  const COLORS = ['#7C3AED', '#A78BFA', '#C4B5FD', '#DDD6FE', '#8B5CF6'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Turnout Timeline Area Chart (8 cols on large screens) */}
      <div className="lg:col-span-8 bg-card border border-border-main rounded-3xl p-6 shadow-xs">
        <div className="mb-4">
          <h4 className="text-base font-bold text-text-main">Voter Turnout Timeline</h4>
          <p className="text-xs text-text-muted">Total votes cast hourly since election launch</p>
        </div>
        
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={hourlyTurnout}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorVotes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#7C3AED" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEE7DA" />
              <XAxis 
                dataKey="hour" 
                stroke="#5E4E73" 
                fontSize={10} 
                fontWeight={600} 
                tickLine={false} 
                axisLine={false} 
              />
              <YAxis 
                stroke="#5E4E73" 
                fontSize={10} 
                fontWeight={600} 
                tickLine={false} 
                axisLine={false} 
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#FFFFFF', 
                  borderColor: '#EEE7DA', 
                  borderRadius: '16px',
                  boxShadow: '0 10px 15px -3px rgba(45, 27, 70, 0.05)',
                  fontFamily: 'var(--font-jakarta)',
                  fontSize: '12px'
                }} 
              />
              <Area 
                type="monotone" 
                dataKey="votes" 
                stroke="#7C3AED" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#colorVotes)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Device Breakdown Pie Chart (4 cols on large screens) */}
      <div className="lg:col-span-4 bg-card border border-border-main rounded-3xl p-6 shadow-xs flex flex-col justify-between">
        <div>
          <h4 className="text-base font-bold text-text-main">Device Breakdown</h4>
          <p className="text-xs text-text-muted">Turnout share by voter hardware platform</p>
        </div>

        <div className="h-52 w-full relative flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={deviceBreakdown}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
              >
                {deviceBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#FFFFFF', 
                  borderColor: '#EEE7DA', 
                  borderRadius: '12px',
                  fontSize: '11px' 
                }} 
              />
            </PieChart>
          </ResponsiveContainer>
          
          {/* Central Percentage */}
          <div className="absolute text-center">
            <span className="text-[10px] uppercase font-bold tracking-wider text-text-muted">Devices</span>
            <span className="block text-2xl font-display font-extrabold text-brand-primary">
              {deviceBreakdown.reduce((acc, curr) => acc + curr.value, 0)}
            </span>
          </div>
        </div>

        {/* Legend labels */}
        <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-bold text-text-muted uppercase tracking-wider pt-2 border-t border-border-main">
          {deviceBreakdown.map((device, index) => (
            <div key={index} className="flex flex-col items-center">
              <span className="w-2.5 h-2.5 rounded-xs mb-1" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
              <span>{device.name}</span>
              <span className="text-text-main text-xs font-extrabold mt-0.5">{device.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Class/Department Participation Bar Chart (12 cols) */}
      <div className="lg:col-span-12 bg-card border border-border-main rounded-3xl p-6 shadow-xs">
        <div className="mb-4">
          <h4 className="text-base font-bold text-text-main">Participation by Department</h4>
          <p className="text-xs text-text-muted">Percentage representation of voters per department</p>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={deptParticipation}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEE7DA" />
              <XAxis 
                dataKey="name" 
                stroke="#5E4E73" 
                fontSize={10} 
                fontWeight={600} 
                tickLine={false} 
                axisLine={false} 
              />
              <YAxis 
                stroke="#5E4E73" 
                fontSize={10} 
                fontWeight={600} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(tick) => `${tick}%`}
              />
              <Tooltip 
                formatter={(value) => [`${value}%`, 'Turnout']}
                contentStyle={{ 
                  backgroundColor: '#FFFFFF', 
                  borderColor: '#EEE7DA', 
                  borderRadius: '16px',
                  fontSize: '12px' 
                }} 
              />
              <Bar 
                dataKey="participation" 
                fill="#7C3AED" 
                radius={[8, 8, 0, 0]} 
                maxBarSize={60}
              >
                {deptParticipation.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
