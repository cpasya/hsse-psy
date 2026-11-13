import React from "react";
import Link from "next/link";
import { Database, LockKeyhole } from "lucide-react";
export function IntegrationPending({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">WORKSPACE HSSE</p>
          <h1>{title}</h1>
          <p className="muted">{description}</p>
        </div>
        <span className="badge neutral">TEST</span>
      </div>
      <section className="card placeholder">
        <div className="placeholder-icon">
          <Database size={32} />
        </div>
        <h2>Data source not connected</h2>
        <p>
          This page is prepared for backend data. Lists, forms, and transaction
          actions will be available after the module API contract is confirmed.
        </p>
        <div className="notice">
          <LockKeyhole size={18} />
          No sample data, local storage, or requests to unconfirmed endpoints
          are used.
        </div>
        <Link className="btn btn-outline" href="/dashboard">
          Back to dashboard
        </Link>
      </section>
    </>
  );
}
