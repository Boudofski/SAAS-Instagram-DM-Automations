"use client";
import { useState } from "react";
import {
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Button } from "@/components/ui/button";
import type { DailyMetric } from "@/lib/admin-v2/analytics";
export function AnalyticsChart({ data }: { data: DailyMetric[] }) {
  const [metric, setMetric] = useState<"sent" | "signups" | "leads" | "failed">(
    "sent",
  );
  return (
    <div className="admin-panel min-w-0">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">Activity over time</h2>
          <p className="mt-1 text-xs text-slate-400">Daily totals · UTC</p>
        </div>
        <div className="flex flex-wrap gap-1">
          {(["sent", "signups", "leads", "failed"] as const).map((m) => (
            <Button
              key={m}
              size="sm"
              variant={metric === m ? "secondary" : "ghost"}
              aria-pressed={metric === m}
              onClick={() => setMetric(m)}
            >
              {m === "sent" ? "Sends" : m[0].toUpperCase() + m.slice(1)}
            </Button>
          ))}
        </div>
      </div>
      <div
        className="h-64 w-full min-w-0"
        role="img"
        aria-label={`Daily ${metric} for the reporting period. Exact values are in the table below.`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ left: 0, right: 12, top: 10, bottom: 0 }}
          >
            <CartesianGrid
              vertical={false}
              stroke="#263040"
              strokeDasharray="3 3"
            />
            <XAxis
              dataKey="date"
              tickFormatter={(v) => v.slice(5)}
              minTickGap={32}
              stroke="#94a3b8"
              fontSize={11}
            />
            <YAxis
              allowDecimals={false}
              width={38}
              stroke="#94a3b8"
              fontSize={11}
            />
            <Tooltip
              contentStyle={{
                background: "#10141e",
                border: "1px solid #334155",
                borderRadius: 8,
                color: "#f8fafc",
              }}
            />
            <Area
              type="monotone"
              dataKey={metric}
              stroke={metric === "failed" ? "#fb7185" : "#a78bfa"}
              fill={metric === "failed" ? "#fb7185" : "#8b5cf6"}
              fillOpacity={0.12}
              strokeWidth={2}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <details className="mt-4">
        <summary className="cursor-pointer text-xs text-slate-400">
          View accessible data table
        </summary>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr>
                {["Date (UTC)", "Sends", "Signups", "Leads", "Failures"].map(
                  (h) => (
                    <th key={h} className="p-2 text-slate-400">
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {data.map((d) => (
                <tr key={d.date} className="border-t border-white/5">
                  <th className="p-2 font-normal">{d.date}</th>
                  <td className="p-2">{d.sent}</td>
                  <td className="p-2">{d.signups}</td>
                  <td className="p-2">{d.leads}</td>
                  <td className="p-2">{d.failed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
