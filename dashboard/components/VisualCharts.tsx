"use client";

import { Card, Title, Text } from "@tremor/react";

export function VisualCharts({ chartData, eventTypeData }: any) {
  // คำนวณหาค่าสูงสุดเพื่อเทียบสัดส่วนกราฟ
  const maxAttacks = chartData?.length ? Math.max(...chartData.map((d: any) => d.Attacks), 1) : 1;
  const totalEvents = eventTypeData?.length ? eventTypeData.reduce((acc: number, curr: any) => acc + curr.count, 0) : 1;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      {/* 1. NATIVE TAILWIND BAR CHART (Timeline) */}
      <Card className="bg-slate-900 border-slate-800">
        <Title className="text-slate-100 mb-6">Attack Timeline (24h)</Title>
        <div className="h-64 flex items-end gap-1 sm:gap-2">
          {chartData?.map((data: any, idx: number) => {
            const heightPercentage = (data.Attacks / maxAttacks) * 100;
            return (
              <div key={idx} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                {/* Tooltip เด้งตอนเอาเมาส์ชี้ */}
                <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-slate-800 text-xs px-2 py-1 rounded text-white transition-opacity whitespace-nowrap z-10 pointer-events-none">
                  {data.time} - {data.Attacks} Attacks
                </div>
                {/* แท่งกราฟ */}
                <div
                  className="w-full bg-blue-500 hover:bg-blue-400 transition-all rounded-t-sm"
                  style={{ 
                    height: `${heightPercentage}%`, 
                    minHeight: data.Attacks > 0 ? '4px' : '0px' 
                  }}
                ></div>
              </div>
            );
          })}
        </div>
        {/* แกน X */}
        <div className="flex justify-between text-xs text-slate-500 mt-3 font-mono">
          <span>{chartData?.[0]?.time || '00:00'}</span>
          <span>{chartData?.[chartData.length - 1]?.time || '23:00'}</span>
        </div>
      </Card>

      {/* 2. NATIVE STACKED BAR (Threat Distribution) */}
      <Card className="bg-slate-900 border-slate-800 flex flex-col">
        <Title className="text-slate-100 mb-6">Threat Distribution</Title>
        <div className="flex-1 flex flex-col justify-center pb-8">
          
          {/* แถบกราฟแนวนอน */}
          <div className="w-full h-12 flex rounded-md overflow-hidden bg-slate-800/50">
            {eventTypeData?.map((data: any, idx: number) => {
              const widthPercentage = (data.count / totalEvents) * 100;
              // ถ้าเป็น COMMAND ให้สีแดง, อย่างอื่นสีส้ม/ฟ้า
              const bgColor = data.name === 'COMMAND' ? 'bg-red-500' : 'bg-amber-500';
              
              return (
                <div
                  key={idx}
                  style={{ width: `${widthPercentage}%` }}
                  className={`${bgColor} h-full group relative flex items-center justify-center transition-all hover:opacity-80`}
                >
                  {widthPercentage > 15 && (
                    <span className="text-xs font-bold text-white/90 drop-shadow-md">
                      {widthPercentage.toFixed(0)}%
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* คำอธิบาย (Legend) */}
          <div className="flex gap-6 mt-8 justify-center">
            {eventTypeData?.map((data: any, idx: number) => {
              const dotColor = data.name === 'COMMAND' ? 'bg-red-500' : 'bg-amber-500';
              return (
                <div key={idx} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${dotColor}`}></div>
                  <Text className="text-slate-300 font-mono text-sm">
                    {data.name} <span className="text-slate-500">({data.count})</span>
                  </Text>
                </div>
              );
            })}
          </div>
          
        </div>
      </Card>

    </div>
  );
}