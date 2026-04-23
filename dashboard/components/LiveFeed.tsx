"use client";

import { useState, useEffect } from "react";

export function LiveFeed({ initialLogs }: { initialLogs: any[] }) {
  const [logs, setLogs] = useState(initialLogs);
  // ท่าไม้ตาย: เช็คว่าอยู่บน Client หรือยัง
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true); // ยืนยันว่าโหลดบน Browser เสร็จแล้ว
    const fetchLogs = async () => {
      try {
        const res = await fetch("/api/logs");
        const data = await res.json();
        setLogs(data);
      } catch (err) {
        console.error("Failed to fetch logs", err);
      }
    };

    const interval = setInterval(fetchLogs, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="divide-y divide-slate-800 max-h-[600px] overflow-y-auto">
      {logs.map((log: any) => (
        <div key={log.id} className="p-6 hover:bg-slate-800/30 transition-all">
          <div className="flex justify-between items-start mb-2">
            <div className="flex gap-3 items-center">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                log.event_type === "COMMAND" ? "bg-red-500/20 text-red-500" : "bg-amber-500/20 text-amber-500"
              }`}>
                {log.event_type}
              </span>
              <code className="text-blue-400 text-sm">{log.ip_address}</code>
            </div>

            {/* --- ส่วนที่แก้ไข --- */}
            <time className="text-[10px] text-slate-600" suppressHydrationWarning>
              {mounted 
                ? new Date(log.created_at).toLocaleString("th-TH") 
                : "" // ถ้ายังไม่ Mount ให้ว่างไว้ก่อน เพื่อให้ Server กับ Client ตรงกัน
              }
            </time>
            {/* -------------------- */}
            
          </div>
          <p className="text-sm font-mono bg-black/40 p-3 rounded border border-slate-800 text-slate-300 mb-3">
            $ {log.details}
          </p>
          {log.ai_analysis && (
            <div className="bg-blue-500/5 border border-blue-500/10 p-3 rounded italic text-sm text-slate-300">
              🤖 AI Analysis: "{log.ai_analysis}"
            </div>
          )}
        </div>
      ))}
    </div>
  );
}