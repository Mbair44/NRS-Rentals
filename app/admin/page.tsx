import Link from "next/link";
import BlockedDatesManager from "@/components/BlockedDatesManager";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";


type BlockedDateRow = {
  id: string;
  blocked_date: string;
  reason: string | null;
  inventory_items: { name: string } | { name: string }[] | null;
};

type BookingRow = {
  id: string;
  booking_number: number;
  status: string;
  rental_date: string;
  event_start_time: string;
  event_end_time: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  delivery_address: string;
  delivery_city: string;
  delivery_state: string;
  delivery_zip: string;
  inventory_name: string;
  total_cents: number;
  created_at: string;
};

function money(cents: number | null | undefined) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format((cents ?? 0) / 100);
}

function displayDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T12:00:00Z`));
}

function displayTime(value: string) {
  const [hourText, minuteText] = value.split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${String(minute).padStart(2, "0")} ${suffix}`;
}

function statusClass(status: string) {
  if (["paid", "confirmed", "completed"].includes(status)) return "paid";
  if (["cancelled", "expired", "refunded"].includes(status)) return "cancelled";
  return "pending";
}

export default async function AdminPage() {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return (
      <main className="section alt">
        <div className="container">
          <div className="admin-empty-state">
            <span className="eyebrow">Admin setup</span>
            <h1>Connect the private admin dashboard</h1>
            <p className="lead">
              Add <code>SUPABASE_SERVICE_ROLE_KEY</code> to your local <code>.env.local</code>,
              restart the development server, and reload this page.
            </p>
            <p className="notice">
              Keep this key private. Never prefix it with <code>NEXT_PUBLIC_</code> and never commit
              <code>.env.local</code> to GitHub.
            </p>
            <Link className="button" href="/">Return to website</Link>
          </div>
        </div>
      </main>
    );
  }

  const today = new Date().toISOString().slice(0, 10);

  const [bookingsResult, customerCountResult, inventoryResult, blockedResult] = await Promise.all([
    supabase
      .from("booking_details")
      .select("*")
      .gte("rental_date", today)
      .order("rental_date", { ascending: true })
      .order("event_start_time", { ascending: true }),
    supabase.from("customers").select("id", { count: "exact", head: true }),
    supabase
      .from("inventory_items")
      .select("id,name,daily_price_cents,active")
      .order("created_at", { ascending: true }),
    supabase
      .from("blocked_dates")
      .select("id,blocked_date,reason,inventory_items(name)")
      .gte("blocked_date", today)
      .order("blocked_date", { ascending: true }),
  ]);

  const error =
    bookingsResult.error || inventoryResult.error || blockedResult.error || customerCountResult.error;

  if (error) {
    return (
      <main className="section alt">
        <div className="container">
          <div className="admin-empty-state">
            <span className="eyebrow">Dashboard error</span>
            <h1>We could not load the admin data</h1>
            <p className="notice">{error.message}</p>
            <p className="muted">
              Confirm that the database schema and booking SQL scripts have both been run.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const bookings = (bookingsResult.data ?? []) as BookingRow[];
  const inventory = inventoryResult.data ?? [];
  const blockedDates = (blockedResult.data ?? []) as BlockedDateRow[];
  const activeBookings = bookings.filter((booking) =>
    ["pending_payment", "paid", "confirmed"].includes(booking.status)
  );
  const paidBookings = bookings.filter((booking) =>
    ["paid", "confirmed", "completed"].includes(booking.status)
  );
  const upcomingRevenue = paidBookings.reduce((sum, booking) => sum + booking.total_cents, 0);
  const todayBookings = activeBookings.filter((booking) => booking.rental_date === today);

  return (
    <main className="admin-page">
      <div className="container admin-shell">
        <aside className="sidebar admin-sidebar">
          <div>
            <span className="admin-brand-kicker">NRS</span>
            <h3>Admin Dashboard</h3>
          </div>
          <nav>
            <a className="active" href="#overview">Overview</a>
            <a href="#bookings">Bookings</a>
            <a href="#inventory">Inventory</a>
            <a href="#blocked">Blocked dates</a>
          </nav>
          <div className="admin-sidebar-footer">
            <Link href="/book">Open booking page</Link>
            <Link href="/">View website</Link>
          </div>
        </aside>

        <section className="admin-content">
          <header className="admin-header" id="overview">
            <div>
              <span className="eyebrow">Business overview</span>
              <h1>NRS Party Rentals</h1>
              <p className="muted">Upcoming operations and reservation activity.</p>
            </div>
            <div className="admin-date">{displayDate(today)}</div>
          </header>

          <div className="stat-grid">
            <article className="stat-card">
              <span>Upcoming bookings</span>
              <strong>{activeBookings.length}</strong>
              <small>{todayBookings.length} scheduled today</small>
            </article>
            <article className="stat-card">
              <span>Paid revenue</span>
              <strong>{money(upcomingRevenue)}</strong>
              <small>From upcoming paid reservations</small>
            </article>
            <article className="stat-card">
              <span>Customers</span>
              <strong>{customerCountResult.count ?? 0}</strong>
              <small>Total customer records</small>
            </article>
            <article className="stat-card">
              <span>Active inventory</span>
              <strong>{inventory.filter((item) => item.active).length}</strong>
              <small>{inventory.length} total items</small>
            </article>
          </div>

          <section className="admin-panel" id="bookings">
            <div className="admin-panel-header">
              <div>
                <span className="eyebrow">Schedule</span>
                <h2>Upcoming bookings</h2>
              </div>
              <Link className="button small" href="/book">Create test booking</Link>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Reservation</th>
                    <th>Date & time</th>
                    <th>Customer</th>
                    <th>Delivery</th>
                    <th>Status</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.length === 0 ? (
                    <tr>
                      <td colSpan={6}>No upcoming bookings yet.</td>
                    </tr>
                  ) : (
                    bookings.map((booking) => (
                      <tr key={`${booking.id}-${booking.inventory_name}`}>
                        <td>
                          <strong>#{booking.booking_number}</strong>
                          <br />
                          <span className="muted">{booking.inventory_name}</span>
                        </td>
                        <td>
                          <strong>{displayDate(booking.rental_date)}</strong>
                          <br />
                          <span className="muted">
                            {displayTime(booking.event_start_time)}–{displayTime(booking.event_end_time)}
                          </span>
                        </td>
                        <td>
                          <strong>{booking.first_name} {booking.last_name}</strong>
                          <br />
                          <a className="admin-contact" href={`mailto:${booking.email}`}>{booking.email}</a>
                          <br />
                          <a className="admin-contact" href={`tel:${booking.phone}`}>{booking.phone}</a>
                        </td>
                        <td>
                          {booking.delivery_address}
                          <br />
                          <span className="muted">
                            {booking.delivery_city}, {booking.delivery_state} {booking.delivery_zip}
                          </span>
                        </td>
                        <td>
                          <span className={`status ${statusClass(booking.status)}`}>
                            {booking.status.replaceAll("_", " ")}
                          </span>
                        </td>
                        <td><strong>{money(booking.total_cents)}</strong></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <div className="admin-lower-grid">
            <section className="admin-panel" id="inventory">
              <div className="admin-panel-header">
                <div>
                  <span className="eyebrow">Rentals</span>
                  <h2>Inventory</h2>
                </div>
              </div>
              <div className="admin-list">
                {inventory.map((item) => (
                  <div className="admin-list-row" key={item.id}>
                    <div>
                      <strong>{item.name}</strong>
                      <br />
                      <span className="muted">{item.active ? "Available for booking" : "Inactive"}</span>
                    </div>
                    <strong>{money(item.daily_price_cents)}</strong>
                  </div>
                ))}
              </div>
            </section>

            <section className="admin-panel" id="blocked">
              <div className="admin-panel-header">
                <div>
                  <span className="eyebrow">Availability</span>
                  <h2>Blocked dates</h2>
                </div>
              </div>
              <BlockedDatesManager
                inventory={inventory.map((item) => ({ id: item.id, name: item.name }))}
                initialBlockedDates={blockedDates}
              />
            </section>
          </div>

          <p className="admin-security-note">
            This dashboard uses a private server-side Supabase key. Add authentication before deploying it publicly.
          </p>
        </section>
      </div>
    </main>
  );
}
