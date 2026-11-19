import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Users } from "lucide-react";
import { assessmentsApi } from "../../api/assessments";
import { invitationsApi } from "../../api/invitations";
import Layout from "../../components/ui/Layout";
import AssessmentTabs from "../../components/ui/AssessmentTabs";
import EmptyState from "../../components/ui/EmptyState";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import { BAND_COLORS, BAND_ORDER } from "../../lib/bands";

const AXIS_TICK = { fontSize: 12, fill: "#697586" };

function ChartTooltip({ active, payload, label, suffix = "" }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-lg">
      <p className="mb-1 text-xs font-semibold text-gray-900">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="flex items-center gap-1.5 text-xs text-gray-600">
          <span
            className="h-2 w-2 shrink-0 rounded-sm"
            style={{ background: p.color || p.fill }}
          />
          <span className="capitalize">{p.name}</span>
          <span className="ml-auto pl-3 font-medium tabular-nums text-gray-900">
            {typeof p.value === "number" ? p.value.toFixed(p.value % 1 ? 1 : 0) : p.value}
            {suffix}
          </span>
        </p>
      ))}
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card-tight">
      <p className="text-2xl font-semibold tabular-nums tracking-tight text-gray-900">{value}</p>
      <p className="mt-0.5 text-xs text-gray-500">{label}</p>
    </div>
  );
}

export default function AnalyticsPage() {
  const { id } = useParams<{ id: string }>();

  const { data: assessment } = useQuery({
    queryKey: ["assessment", id],
    queryFn: () => assessmentsApi.get(Number(id)).then((r) => r.data),
  });

  const { data: analytics, isLoading } = useQuery({
    queryKey: ["analytics", id],
    queryFn: () => invitationsApi.cohortAnalytics(Number(id)).then((r) => r.data),
    refetchInterval: 60_000,
  });

  const avgData =
    analytics?.trait_analytics.map((t) => ({
      name: t.trait_name,
      score: t.average_score ?? 0,
    })) ?? [];

  const bandData =
    analytics?.trait_analytics.map((t) => ({
      name: t.trait_name,
      low: t.band_distribution.low ?? 0,
      mid: t.band_distribution.mid ?? 0,
      high: t.band_distribution.high ?? 0,
    })) ?? [];

  // Horizontal bars: trait names are long ("Conscientiousness") and read far
  // better on the y-axis than rotated under vertical columns.
  const chartHeight = Math.max(200, avgData.length * 44 + 40);

  return (
    <Layout
      title="Analytics"
      subtitle={assessment?.title}
      breadcrumbs={[
        { label: "Assessments", href: "/" },
        { label: assessment?.title || "…", href: `/assessments/${id}` },
        { label: "Analytics" },
      ]}
    >
      <AssessmentTabs assessmentId={id!} />

      {isLoading && (
        <div className="flex justify-center py-20">
          <LoadingSpinner />
        </div>
      )}

      {analytics && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile label="Invited" value={analytics.total} />
            <StatTile label="Completed" value={analytics.completed} />
            <StatTile label="In progress" value={analytics.in_progress} />
            <StatTile
              label="Completion rate"
              value={analytics.completion_rate !== null ? `${analytics.completion_rate}%` : "—"}
            />
          </div>

          {analytics.completed === 0 ? (
            <div className="card">
              <EmptyState
                compact
                icon={<Users size={22} />}
                title="No completed sessions yet"
                message="Trait scores and band distribution appear here as soon as the first participant submits."
              />
            </div>
          ) : (
            <>
              <div className="card">
                <div className="mb-1">
                  <h3 className="section-title">Average score by trait</h3>
                  <p className="page-subtitle">
                    Normalised 0–100 across {analytics.completed} completed{" "}
                    {analytics.completed === 1 ? "response" : "responses"}.
                  </p>
                </div>
                <ResponsiveContainer width="100%" height={chartHeight}>
                  <BarChart
                    data={avgData}
                    layout="vertical"
                    margin={{ top: 16, right: 44, bottom: 0, left: 8 }}
                    barCategoryGap="28%"
                  >
                    <CartesianGrid horizontal={false} stroke="#e7ebf0" strokeDasharray="3 3" />
                    <XAxis
                      type="number"
                      domain={[0, 100]}
                      ticks={[0, 25, 50, 75, 100]}
                      tick={AXIS_TICK}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={130}
                      tick={AXIS_TICK}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: "#f1f5f9" }}
                      content={<ChartTooltip />}
                    />
                    <Bar dataKey="score" name="Avg score" fill="#4f46e5" radius={[0, 4, 4, 0]}>
                      <LabelList
                        dataKey="score"
                        position="right"
                        formatter={(v: number) => v.toFixed(0)}
                        className="fill-gray-500"
                        style={{ fontSize: 12, fontWeight: 500 }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="card">
                <div className="mb-1">
                  <h3 className="section-title">Score band distribution</h3>
                  <p className="page-subtitle">
                    How many participants fall into each band, per trait.
                  </p>
                </div>

                <div className="mb-4 mt-3 flex flex-wrap items-center gap-4">
                  {BAND_ORDER.map((band) => (
                    <span key={band} className="flex items-center gap-1.5 text-xs text-gray-600">
                      <span
                        className="h-2.5 w-2.5 rounded-sm"
                        style={{ background: BAND_COLORS[band] }}
                      />
                      <span className="capitalize">{band}</span>
                    </span>
                  ))}
                </div>

                <ResponsiveContainer width="100%" height={chartHeight}>
                  <BarChart
                    data={bandData}
                    layout="vertical"
                    margin={{ top: 0, right: 16, bottom: 0, left: 8 }}
                    barCategoryGap="28%"
                  >
                    <CartesianGrid horizontal={false} stroke="#e7ebf0" strokeDasharray="3 3" />
                    <XAxis
                      type="number"
                      allowDecimals={false}
                      tick={AXIS_TICK}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={130}
                      tick={AXIS_TICK}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip cursor={{ fill: "#f1f5f9" }} content={<ChartTooltip />} />
                    {BAND_ORDER.map((band, i) => (
                      <Bar
                        key={band}
                        dataKey={band}
                        name={band}
                        stackId="bands"
                        fill={BAND_COLORS[band]}
                        /* 2px surface stroke = the gap between stacked segments */
                        stroke="#ffffff"
                        strokeWidth={2}
                        radius={i === BAND_ORDER.length - 1 ? [0, 4, 4, 0] : undefined}
                      >
                        <LabelList
                          dataKey={band}
                          position="center"
                          formatter={(v: number) => (v > 0 ? v : "")}
                          fill="#ffffff"
                          style={{ fontSize: 11, fontWeight: 600 }}
                        />
                      </Bar>
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>
      )}
    </Layout>
  );
}
