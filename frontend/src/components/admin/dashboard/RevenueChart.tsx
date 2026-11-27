"use client";

import { compactMoney, monthLabel, revenueChart } from "@/lib/admin-dashboard";
import type { MonthRevenue } from "@/types/admin";

const WIDTH = 720;
const HEIGHT = 260;
const LEFT = 62;
const RIGHT = 12;
const TOP = 14;
const BOTTOM = 38;
const COLORS = ["#2563eb", "#0f9f8f", "#f59e0b", "#8b5cf6"];

export function RevenueChart({ rows }: { rows: MonthRevenue[] }) {
  const chart = revenueChart(rows);
  const plotWidth = WIDTH - LEFT - RIGHT;
  const plotHeight = HEIGHT - TOP - BOTTOM;
  const groupWidth = plotWidth / Math.max(chart.months.length, 1);
  const barWidth = Math.min(14, groupWidth / Math.max(chart.series.length * 1.5, 1));

  if (chart.max === 0) return <p className="adm-note">Chưa có doanh thu trong 6 tháng gần đây.</p>;

  return (
    <div className="adm-chart-wrap">
      <svg className="adm-chart" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img"
        aria-label="Doanh thu theo khu vực trong sáu tháng gần đây">
        <ChartAxes ticks={chart.ticks} max={chart.max} plotHeight={plotHeight} />
        {chart.months.map((month, index) => <MonthBars key={month} month={month} index={index}
          chart={chart} groupWidth={groupWidth} barWidth={barWidth} plotHeight={plotHeight} />)}
      </svg>
      <ul className="adm-chart-legend" aria-label="Khu vực">
        {chart.series.map((series, index) => (
          <li key={series.code}><span style={{ backgroundColor: COLORS[index % COLORS.length] }} />{series.name}</li>
        ))}
      </ul>
    </div>
  );
}

function ChartAxes({ ticks, max, plotHeight }: { ticks: number[]; max: number; plotHeight: number }) {
  return <>{ticks.map(tick => {
    const y = TOP + plotHeight - (tick / max) * plotHeight;
    return <g key={tick}>
      <line x1={LEFT} x2={WIDTH - RIGHT} y1={y} y2={y} className="adm-chart-grid" />
      <text x={LEFT - 8} y={y + 4} textAnchor="end" className="adm-chart-axis">{compactMoney(tick)}</text>
    </g>;
  })}</>;
}

function MonthBars({ month, index, chart, groupWidth, barWidth, plotHeight }: {
  month: string; index: number; chart: ReturnType<typeof revenueChart>;
  groupWidth: number; barWidth: number; plotHeight: number;
}) {
  const center = LEFT + groupWidth * (index + 0.5);
  const barsWidth = chart.series.length * barWidth;
  return <g>
    {chart.series.map((series, seriesIndex) => {
      const value = series.values[index] ?? 0;
      const height = (value / chart.max) * plotHeight;
      return <rect key={series.code} x={center - barsWidth / 2 + seriesIndex * barWidth}
        y={TOP + plotHeight - height} width={Math.max(barWidth - 2, 1)} height={height}
        rx="3" fill={COLORS[seriesIndex % COLORS.length]}>
        <title>{`${series.name}, ${monthLabel(month)}: ${value.toLocaleString("vi-VN")} ₫`}</title>
      </rect>;
    })}
    <text x={center} y={HEIGHT - 12} textAnchor="middle" className="adm-chart-axis">
      {monthLabel(month, true)}
    </text>
  </g>;
}
