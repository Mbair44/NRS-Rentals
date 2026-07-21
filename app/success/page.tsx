import Link from "next/link";

type Props = {
  searchParams: Promise<{ booking?: string; date?: string }>;
};

export default async function SuccessPage({ searchParams }: Props) {
  const params = await searchParams;
  const prettyDate = params.date
    ? new Date(`${params.date}T12:00:00`).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <main className="section alt">
      <div className="container">
        <div className="form-card" style={{ maxWidth: 720, margin: "0 auto", textAlign: "center" }}>
          <span className="eyebrow">Reservation received</span>
          <h2>Your date is reserved!</h2>
          {params.booking && (
            <p className="lead">
              Confirmation number: <strong>#{params.booking}</strong>
            </p>
          )}
          {prettyDate && <p className="lead">Rental date: <strong>{prettyDate}</strong></p>}
          <p className="muted">
            This test reservation has been saved in Supabase. No payment was collected.
          </p>
          <div className="actions" style={{ justifyContent: "center" }}>
            <Link className="button" href="/">Return Home</Link>
            <Link className="button secondary" href="/book">View Calendar</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
