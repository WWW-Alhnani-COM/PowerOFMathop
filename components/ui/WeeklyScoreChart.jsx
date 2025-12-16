'use client';
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const chartData = [
  { name: 'الأحد', Score: 4000 },
  { name: 'الإثنين', Score: 3000 },
  { name: 'الثلاثاء', Score: 2000 },
  { name: 'الأربعاء', Score: 5780 },
  { name: 'الخميس', Score: 1890 },
  { name: 'الجمعة', Score: 2390 },
  { name: 'السبت', Score: 3490 },
];

export const WeeklyScoreChart = () => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700" dir="rtl">
        <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-extrabold text-gray-800 dark:text-gray-200">نقاط الأداء الأسبوعي</h3>
            <span className="text-xs font-medium px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full">آخر 7 أيام</span>
        </div>
        
        <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis 
                        dataKey="name" 
                        reversed={true} 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: '#6b7280', fontSize: 12}}
                        dy={10}
                    />
                    <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: '#6b7280', fontSize: 12}}
                    />
                    <Tooltip 
                        cursor={{fill: 'transparent'}}
                        contentStyle={{ 
                            borderRadius: '12px', 
                            border: 'none', 
                            background: '#1f2937', 
                            color: 'white',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                        }} 
                        itemStyle={{ color: '#fff' }}
                    />
                    <Bar 
                        dataKey="Score" 
                        fill="#6366f1" 
                        radius={[6, 6, 0, 0]} 
                        barSize={30}
                        animationDuration={1500}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    </div>
);