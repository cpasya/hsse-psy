import React from "react";
import {
  Activity,
  ClipboardCheck,
  ListChecks,
  ShieldAlert,
  TriangleAlert,
} from "lucide-react";
import type { DashboardSnapshot } from "../types";
export function Dashboard({ data }: { data?: DashboardSnapshot }) {
  const cards = [
    {
      label: "Incident Reports",
      value: data?.metrics.incidents,
      icon: TriangleAlert,
    },
    {
      label: "Open Action",
      value: data?.metrics.openActions,
      icon: ListChecks,
    },
    {
      label: "High Risks",
      value: data?.metrics.highRisks,
      icon: ShieldAlert,
    },
    {
      label: "Inspection Completion",
      value: data?.metrics.inspectionCompletion,
      icon: ClipboardCheck,
      percent: true,
    },
  ];
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">OVERVIEW / HSSE PERFORMANCE</p>
          <h1>
            Dashboard HSSE<span className="heading-dot">.</span>
          </h1>
          <p className="muted">
            Operational summary from verified data sources.
          </p>
        </div>
        <span className="badge neutral">
          {data ? "API Data" : "Awaiting API Integration"}
        </span>
      </div>
      {!data && (
        <div className="notice" role="status">
          The dashboard data source has not been connected yet.
        </div>
      )}
      <div className="metrics-grid">
        {cards.map((card) => (
          <section className="card metric-card" key={card.label}>
            <div className="metric-top">
              <span className="metric-icon">
                <card.icon size={19} />
              </span>
            </div>
            <p>{card.label}</p>
            <strong className="metric-value">
              {card.value === null || card.value === undefined
                ? "—"
                : String(card.value) + (card.percent ? "%" : "")}
            </strong>
            <small>
              {card.value === null || card.value === undefined
                ? "Data unavailable"
                : "From API source"}
            </small>
          </section>
        ))}
      </div>
      <div className="analytics-grid">
        <section className="card placeholder">
          <Activity size={28} />
          <h2>Report Trends</h2>
          {/* <p>
            Grafik akan ditampilkan setelah kontrak data tren dan API
            disepakati. Tidak ada angka atau grafik pengganti.
          </p> */}
        </section>
        <section className="card placeholder">
          <ListChecks size={28} />
          <h2>Priority Follow-ups</h2>
          {/* <p>
            Daftar tindak lanjut menunggu sumber data operasional. Tidak ada
            entri contoh yang ditampilkan.
          </p> */}
        </section>
      </div>
      <section className="card placeholder">
        <h2>Recent Activity</h2>
        {/* <p>
          Riwayat aktivitas akan berasal dari layanan backend setelah
          terintegrasi.
        </p> */}
      </section>
    </>
  );
}
