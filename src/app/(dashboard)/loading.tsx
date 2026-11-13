export default function Loading() {
  return (
    <section
      className="card skeleton-wrap"
      role="status"
      aria-label="Loading page"
    >
      <div className="skeleton" />
      <div className="skeleton" />
      <div className="skeleton" />
    </section>
  );
}
