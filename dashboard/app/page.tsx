import { getLogs, getEventTypeStats, getTimelineStats } from "@/lib/db";
import { VisualCharts } from "@/components/VisualCharts";
import { LiveFeed } from "@/components/LiveFeed";
import {
    Card,
    Title,
    Text,
    Metric,
    Grid,
} from "@tremor/react";


export const dynamic = "force-dynamic";
export const revalidate = 5;

export default async function Home() {
    const [logs, eventTypeData, chartData] = await Promise.all([
        getLogs(),
        getEventTypeStats(),
        getTimelineStats(),
    ]);

    return (
        <main className="min-h-screen bg-slate-950 text-slate-200 p-6 md:p-10 space-y-8">
            {/* ลองแสดงผลดิบๆ ออกมาดูที่หัวเว็บ */}
            {/*<div className="bg-black text-green-500 p-2 text-[10px] font-mono">
                CHART_DATA: {JSON.stringify(chartData)} | EVENT_DATA:{" "}
                {JSON.stringify(eventTypeData)}
            </div>*/}

            {/* HEADER */}
            <header className="flex justify-between items-center border-b border-slate-800 pb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tighter text-blue-500">
                        🛰️ NEBULAGUARD
                    </h1>
                    <p className="text-slate-500 text-sm">
                        AI-Powered Security Intelligence Command Center
                    </p>
                </div>
                <div className="flex flex-col items-end">
                    <span className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/20">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        SYSTEM ACTIVE
                    </span>
                </div>
            </header>

            {/* KPI CARDS */}
            <Grid numItemsMd={2} numItemsLg={3} className="gap-6">
                <Card
                    decoration="top"
                    decorationColor="blue"
                    className="bg-slate-900 border-slate-800"
                >
                    <Text className="text-slate-400">
                        Total Intrusion Events
                    </Text>
                    <Metric className="text-slate-100">{logs.length}</Metric>
                </Card>
                <Card
                    decoration="top"
                    decorationColor="red"
                    className="bg-slate-900 border-slate-800"
                >
                    <Text className="text-slate-400">
                        COMMAND Events (High Risk)
                    </Text>
                    <Metric className="text-slate-100">
                        {logs.filter((l) => l.event_type === "COMMAND").length}
                    </Metric>
                </Card>
                <Card
                    decoration="top"
                    decorationColor="emerald"
                    className="bg-slate-900 border-slate-800"
                >
                    <Text className="text-slate-400">AI Forensics Uptime</Text>
                    <Metric className="text-slate-100">99.9%</Metric>
                </Card>
            </Grid>

            {/* CHARTS */}
            
            <VisualCharts 
              chartData={chartData} 
              eventTypeData={eventTypeData} 
            />
            

            {/* LIVE FEED */}
            <Card className="bg-slate-900 border-slate-800 p-0 overflow-hidden">
                <div className="p-6 border-b border-slate-800">
                    <Title className="text-slate-100">Live AI Forensic Feed</Title>
                </div>
                {/* ส่งข้อมูลเริ่มต้น (SSR) เข้าไปก่อนเพื่อให้หน้าเว็บไม่ว่างตอนโหลดครั้งแรก */}
                <LiveFeed initialLogs={logs} />
            </Card>
        </main>
    );
}
