export default function Loading() {
  return (
    <section
      className="card skeleton-wrap"
      role="status"
      aria-label="Memuat halaman"
    >
      <div className="skeleton" />
      <div className="skeleton" />
      <div className="skeleton" />
    </section>
  );
}
