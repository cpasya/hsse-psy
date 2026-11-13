import Link from "next/link";
import { Wrench, ArrowUpRight, LockKeyhole } from "lucide-react";
export function ModulePlaceholder({
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
        <span className="badge neutral">Planned</span>
      </div>
      <section className="card placeholder">
        <div className="placeholder-icon">
          <Wrench size={32} />
        </div>
        <h2>Ready for the next step.</h2>
        <p>
          This module is still being planned. Its API contract, approval flow,
          and data policies have not been finalized.
        </p>
        <div className="notice">
          <LockKeyhole size={18} />
          No operational data or upload actions are simulated here.
        </div>
        <Link className="btn btn-outline" href="/dashboard">
          Back to dashboard <ArrowUpRight size={18} />
        </Link>
      </section>
    </>
  );
}
export function Forbidden() {
  return (
    <section className="card state">
      <LockKeyhole size={32} />
      <h1>403 · Access restricted</h1>
      <p>Your account does not have permission to open this module.</p>
      <Link className="btn btn-outline" href="/dashboard">
        Back to dashboard
      </Link>
    </section>
  );
}
