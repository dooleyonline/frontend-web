"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

const chartData = [
  { date: "2024-04-01", revenue: 222, views: 150, saved: 87 },
  { date: "2024-04-02", revenue: 97, views: 180, saved: 123 },
  { date: "2024-04-03", revenue: 167, views: 120, saved: 65 },
  { date: "2024-04-04", revenue: 242, views: 260, saved: 112 },
  { date: "2024-04-05", revenue: 373, views: 290, saved: 94 },
  { date: "2024-04-06", revenue: 301, views: 340, saved: 76 },
  { date: "2024-04-07", revenue: 245, views: 180, saved: 103 },
  { date: "2024-04-08", revenue: 409, views: 320, saved: 145 },
  { date: "2024-04-09", revenue: 59, views: 110, saved: 68 },
  { date: "2024-04-10", revenue: 261, views: 190, saved: 91 },
  { date: "2024-04-11", revenue: 327, views: 350, saved: 117 },
  { date: "2024-04-12", revenue: 292, views: 210, saved: 58 },
  { date: "2024-04-13", revenue: 342, views: 380, saved: 135 },
  { date: "2024-04-14", revenue: 137, views: 220, saved: 82 },
  { date: "2024-04-15", revenue: 120, views: 170, saved: 95 },
  { date: "2024-04-16", revenue: 138, views: 190, saved: 72 },
  { date: "2024-04-17", revenue: 446, views: 360, saved: 129 },
  { date: "2024-04-18", revenue: 364, views: 410, saved: 98 },
  { date: "2024-04-19", revenue: 243, views: 180, saved: 110 },
  { date: "2024-04-20", revenue: 89, views: 150, saved: 63 },
  { date: "2024-04-21", revenue: 137, views: 200, saved: 89 },
  { date: "2024-04-22", revenue: 224, views: 170, saved: 124 },
  { date: "2024-04-23", revenue: 138, views: 230, saved: 101 },
  { date: "2024-04-24", revenue: 387, views: 290, saved: 77 },
  { date: "2024-04-25", revenue: 215, views: 250, saved: 141 },
  { date: "2024-04-26", revenue: 75, views: 130, saved: 54 },
  { date: "2024-04-27", revenue: 383, views: 420, saved: 119 },
  { date: "2024-04-28", revenue: 122, views: 180, saved: 83 },
  { date: "2024-04-29", revenue: 315, views: 240, saved: 92 },
  { date: "2024-04-30", revenue: 454, views: 380, saved: 132 },
  { date: "2024-05-01", revenue: 165, views: 220, saved: 75 },
  { date: "2024-05-02", revenue: 293, views: 310, saved: 106 },
  { date: "2024-05-03", revenue: 247, views: 190, saved: 67 },
  { date: "2024-05-04", revenue: 385, views: 420, saved: 128 },
  { date: "2024-05-05", revenue: 481, views: 390, saved: 93 },
  { date: "2024-05-06", revenue: 498, views: 520, saved: 142 },
  { date: "2024-05-07", revenue: 388, views: 300, saved: 88 },
  { date: "2024-05-08", revenue: 149, views: 210, saved: 71 },
  { date: "2024-05-09", revenue: 227, views: 180, saved: 115 },
  { date: "2024-05-10", revenue: 293, views: 330, saved: 85 },
  { date: "2024-05-11", revenue: 335, views: 270, saved: 97 },
  { date: "2024-05-12", revenue: 197, views: 240, saved: 116 },
  { date: "2024-05-13", revenue: 197, views: 160, saved: 69 },
  { date: "2024-05-14", revenue: 448, views: 490, saved: 138 },
  { date: "2024-05-15", revenue: 473, views: 380, saved: 84 },
  { date: "2024-05-16", revenue: 338, views: 400, saved: 120 },
  { date: "2024-05-17", revenue: 499, views: 420, saved: 99 },
  { date: "2024-05-18", revenue: 315, views: 350, saved: 73 },
  { date: "2024-05-19", revenue: 235, views: 180, saved: 127 },
  { date: "2024-05-20", revenue: 177, views: 230, saved: 61 },
  { date: "2024-05-21", revenue: 82, views: 140, saved: 102 },
  { date: "2024-05-22", revenue: 81, views: 120, saved: 52 },
  { date: "2024-05-23", revenue: 252, views: 290, saved: 146 },
  { date: "2024-05-24", revenue: 294, views: 220, saved: 90 },
  { date: "2024-05-25", revenue: 201, views: 250, saved: 79 },
  { date: "2024-05-26", revenue: 213, views: 170, saved: 113 },
  { date: "2024-05-27", revenue: 420, views: 460, saved: 108 },
  { date: "2024-05-28", revenue: 233, views: 190, saved: 57 },
  { date: "2024-05-29", revenue: 78, views: 130, saved: 96 },
  { date: "2024-05-30", revenue: 340, views: 280, saved: 131 },
  { date: "2024-05-31", revenue: 178, views: 230, saved: 74 },
  { date: "2024-06-01", revenue: 178, views: 200, saved: 109 },
  { date: "2024-06-02", revenue: 470, views: 410, saved: 148 },
  { date: "2024-06-03", revenue: 103, views: 160, saved: 62 },
  { date: "2024-06-04", revenue: 439, views: 380, saved: 111 },
  { date: "2024-06-05", revenue: 88, views: 140, saved: 53 },
  { date: "2024-06-06", revenue: 294, views: 250, saved: 125 },
  { date: "2024-06-07", revenue: 323, views: 370, saved: 86 },
  { date: "2024-06-08", revenue: 385, views: 320, saved: 137 },
  { date: "2024-06-09", revenue: 438, views: 480, saved: 107 },
  { date: "2024-06-10", revenue: 155, views: 200, saved: 70 },
  { date: "2024-06-11", revenue: 92, views: 150, saved: 118 },
  { date: "2024-06-12", revenue: 492, views: 420, saved: 143 },
  { date: "2024-06-13", revenue: 81, views: 130, saved: 59 },
  { date: "2024-06-14", revenue: 426, views: 380, saved: 133 },
  { date: "2024-06-15", revenue: 307, views: 350, saved: 81 },
  { date: "2024-06-16", revenue: 371, views: 310, saved: 104 },
  { date: "2024-06-17", revenue: 475, views: 520, saved: 147 },
  { date: "2024-06-18", revenue: 107, views: 170, saved: 66 },
  { date: "2024-06-19", revenue: 341, views: 290, saved: 122 },
  { date: "2024-06-20", revenue: 408, views: 450, saved: 139 },
  { date: "2024-06-21", revenue: 169, views: 210, saved: 55 },
  { date: "2024-06-22", revenue: 317, views: 270, saved: 100 },
  { date: "2024-06-23", revenue: 480, views: 530, saved: 150 },
  { date: "2024-06-24", revenue: 132, views: 180, saved: 78 },
  { date: "2024-06-25", revenue: 141, views: 190, saved: 95 },
  { date: "2024-06-26", revenue: 434, views: 380, saved: 121 },
  { date: "2024-06-27", revenue: 448, views: 490, saved: 114 },
  { date: "2024-06-28", revenue: 149, views: 200, saved: 60 },
  { date: "2024-06-29", revenue: 103, views: 160, saved: 91 },
  { date: "2024-06-30", revenue: 446, views: 400, saved: 126 },
];

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "var(--chart-1)",
  },
  views: {
    label: "Views",
    color: "var(--chart-1)",
  },
  saved: {
    label: "Saved",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

const MarketplaceProfileSummarySection = () => {
  const [activeChart, setActiveChart] =
    useState<keyof typeof chartConfig>("revenue");

  const total = useMemo(
    () => ({
      revenue: chartData.reduce((acc, curr) => acc + curr.revenue, 0),
      views: chartData.reduce((acc, curr) => acc + curr.views, 0),
      saved: chartData.reduce((acc, curr) => acc + curr.saved, 0),
    }),
    []
  );

  return (
    <section id="profile-summary">
      <Card>
        <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
          <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
            <CardTitle>Summary</CardTitle>
            <CardDescription>Summary of the last 3 months</CardDescription>
          </div>
          <div className="flex">
            {["revenue", "views", "saved"].map((key) => {
              const chart = key as keyof typeof chartConfig;
              return (
                <button
                  key={chart}
                  data-active={activeChart === chart}
                  className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l data-[active=true]:bg-muted/50 sm:border-l sm:border-t-0 sm:px-8 sm:py-6"
                  onClick={() => setActiveChart(chart)}
                >
                  <span className="text-xs text-muted-foreground">
                    {chartConfig[chart].label}
                  </span>
                  <span className="text-lg font-bold leading-none sm:text-3xl">
                    {total[key as keyof typeof total].toLocaleString()}
                  </span>
                </button>
              );
            })}
          </div>
        </CardHeader>
        <CardContent className="px-2 sm:p-6">
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[250px] w-full"
          >
            <AreaChart
              accessibilityLayer
              data={chartData}
              margin={{
                left: 12,
                right: 12,
              }}
            >
              <defs>
                <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-chart-1)"
                    stopOpacity={0.95}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-chart-1)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  });
                }}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    className="w-[150px]"
                    nameKey={activeChart}
                    labelFormatter={(value) => {
                      return new Date(value).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      });
                    }}
                  />
                }
              />
              <Area
                dataKey={activeChart}
                type="basis"
                stroke="var(--color-primary)"
                isAnimationActive={true}
                fill="url(#gradient)"
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </section>
  );
};

export default MarketplaceProfileSummarySection;
