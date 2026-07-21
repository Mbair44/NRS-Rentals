import Link from "next/link";
import { getActiveInventory } from "@/lib/inventory";

export const dynamic = "force-dynamic";

function dollars(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export default async function HomePage() {
  const inventory = await getActiveInventory();
  const featured = inventory[0];
  const price = featured ? dollars(featured.daily_price_cents) : "$350";

  return (
    <main>
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <span className="eyebrow">East Valley bounce-house rentals</span>
            <h1>Party fun, booked in under a minute.</h1>
            <p className="lead">
              Reserve online, pay securely, and get instant confirmation. We deliver,
              set up, and pick up throughout Gilbert, Chandler, and Mesa.
            </p>
            <div className="actions">
              <Link className="button" href="/book">See Available Dates</Link>
              <a className="button secondary" href="#rental">View Pricing</a>
            </div>
            <div className="highlights">
              <span>✓ {price} per day</span>
              <span>✓ Free delivery</span>
              <span>✓ Setup included</span>
            </div>
          </div>
          {featured?.image_url ? (
            <img className="photo-placeholder" src={featured.image_url} alt={featured.name} />
          ) : (
            <div className="photo-placeholder">Bounce-house photo coming soon</div>
          )}
        </div>
      </section>

      <section id="rental" className="section">
        <div className="container">
          <div className="section-title">
            <span className="eyebrow">Live inventory</span>
            <h2>{inventory.length === 1 ? "One bounce house. One easy price." : "Choose your party rental."}</h2>
          </div>
          {inventory.length === 0 ? (
            <div className="card">
              <h3>Inventory is being connected</h3>
              <p>Check your Supabase environment settings, then refresh this page.</p>
            </div>
          ) : (
            inventory.map((item) => (
              <div className="price-card" key={item.id}>
                {item.image_url ? (
                  <img className="photo-placeholder" src={item.image_url} alt={item.name} />
                ) : (
                  <div className="photo-placeholder">Product photo coming soon</div>
                )}
                <div>
                  <h3>{item.name}</h3>
                  <p className="muted">{item.description}</p>
                  <div className="price">{dollars(item.daily_price_cents)}</div>
                  <p className="muted">per day, including delivery, setup, and pickup</p>
                  <ul>
                    <li>Instant online booking</li>
                    <li>Secure checkout through Stripe</li>
                    <li>No separate delivery fee in the current service area</li>
                  </ul>
                  <Link className="button" href={`/book?item=${item.id}`}>Reserve Now</Link>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="section alt">
        <div className="container">
          <div className="section-title">
            <span className="eyebrow">How it works</span>
            <h2>From calendar to confirmed.</h2>
          </div>
          <div className="cards">
            <article className="card"><h3>1. Pick a date</h3><p>See live availability and select an open day.</p></article>
            <article className="card"><h3>2. Enter event details</h3><p>Add your delivery address, contact info, and event notes.</p></article>
            <article className="card"><h3>3. Pay securely</h3><p>Complete checkout and receive an instant confirmation.</p></article>
          </div>
        </div>
      </section>

      <section id="service-area" className="section">
        <div className="container">
          <div className="section-title">
            <span className="eyebrow">Current service area</span>
            <h2>Free delivery in Gilbert, Chandler, and Mesa.</h2>
          </div>
          <div className="cards">
            <article className="card"><h3>Gilbert</h3><p>Birthdays, backyards, schools, churches, and neighborhood events.</p></article>
            <article className="card"><h3>Chandler</h3><p>Simple delivery and setup with no separate delivery charge.</p></article>
            <article className="card"><h3>Mesa</h3><p>Full-day bounce-house rentals with online checkout.</p></article>
          </div>
        </div>
      </section>
    </main>
  );
}
