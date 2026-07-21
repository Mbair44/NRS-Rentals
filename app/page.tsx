import Link from "next/link";
import { getActiveInventory } from "@/lib/inventory";
import HomeCatalog from "@/components/HomeCatalog";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const inventory = await getActiveInventory();
  const featured = inventory[0];

  return (
    <main>
      <section className="hero v8-hero">
        <div className="hero-orb orb-one" /><div className="hero-orb orb-two" />
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">Party rentals across Arizona’s East Valley</span>
            <h1>Big fun.<br /><span>Zero stress.</span></h1>
            <p className="lead">Clean inflatables, affordable pricing, and easy online booking for birthdays, schools, churches, neighborhood events, and more.</p>
            <div className="actions">
              <Link className="button" href="/book">Browse Available Rentals</Link>
              <a className="button secondary" href="#how-it-works">How It Works</a>
            </div>
            <div className="hero-trust">
              <span>✓ Clean & sanitized</span><span>✓ Affordable pricing</span><span>✓ Setup included</span>
            </div>
          </div>
          <div className="hero-visual">
            {featured?.image_url ? <img src={featured.image_url} alt={featured.name} /> : <img className="hero-logo-art" src="/nrs-logo.png" alt="NRS inflatable rentals" />}
            <div className="floating-note note-one"><strong>Fast booking</strong><span>Reserve online anytime</span></div>
            <div className="floating-note note-two"><strong>Local service</strong><span>Gilbert · Mesa · Chandler</span></div>
          </div>
        </div>
      </section>

      <section className="trust-strip" aria-label="NRS service promises">
        <div className="container trust-strip-grid">
          <div><span>🧼</span><strong>Clean & Sanitized</strong><small>Prepared before every rental</small></div>
          <div><span>💲</span><strong>Affordable Pricing</strong><small>Fun that fits your budget</small></div>
          <div><span>🚚</span><strong>Delivery & Setup</strong><small>We handle the heavy lifting</small></div>
          <div><span>⚡</span><strong>Fast Online Booking</strong><small>Live availability and checkout</small></div>
        </div>
      </section>

      <section id="rentals" className="section storefront-section">
        <div className="container">
          <div className="section-heading-row">
            <div><span className="eyebrow">Find your perfect rental</span><h2>Bring the fun to your next event.</h2><p className="lead compact">Browse the current collection, sort by price, and reserve online in a few simple steps.</p></div>
            <Link className="text-link" href="/book">View booking calendar →</Link>
          </div>
          <HomeCatalog inventory={inventory} />
        </div>
      </section>

      <section id="how-it-works" className="section alt">
        <div className="container">
          <div className="centered-heading"><span className="eyebrow">Simple from start to finish</span><h2>Your party, handled.</h2></div>
          <div className="steps-grid">
            <article><span>01</span><h3>Choose your fun</h3><p>Browse rentals and select the equipment that fits your event.</p></article>
            <article><span>02</span><h3>Pick your date</h3><p>Use live availability to choose an open day and enter event details.</p></article>
            <article><span>03</span><h3>Book securely</h3><p>Complete checkout online and receive an instant confirmation.</p></article>
            <article><span>04</span><h3>Enjoy the party</h3><p>We deliver, set up, and return for pickup after the fun.</p></article>
          </div>
        </div>
      </section>

      <section className="section occasions-section">
        <div className="container occasions-grid">
          <div className="occasion-copy"><span className="eyebrow">Made for every celebration</span><h2>More than birthday parties.</h2><p className="lead compact">Inflatables make an easy centerpiece for gatherings of all sizes.</p><Link className="button" href="/book">Plan Your Event</Link></div>
          <div className="occasion-list"><span>🎂 Birthday parties</span><span>🏫 School events</span><span>⛪ Church activities</span><span>🏘️ Neighborhood parties</span><span>🏢 Company events</span><span>⚾ Team celebrations</span></div>
        </div>
      </section>

      <section className="section reviews-section">
        <div className="container">
          <div className="centered-heading"><span className="eyebrow">A local company built around service</span><h2>A five-star experience is the goal.</h2><p>Verified customer reviews can be added here as bookings come in. Until then, every reservation is backed by clear communication, clean equipment, and dependable setup.</p></div>
          <div className="review-preview">
            <div className="stars">★★★★★</div><h3>Your review could be here</h3><p>After each rental, customers can receive the Google review link through the SMS workflow already included in the project.</p>
          </div>
        </div>
      </section>

      <section id="service-area" className="section service-section">
        <div className="container service-grid">
          <div><span className="eyebrow">Proudly serving the East Valley</span><h2>Local delivery. Friendly service.</h2><p className="lead compact">Current primary service areas include Gilbert, Chandler, and Mesa. Contact NRS before booking for events outside these cities.</p><div className="city-tags"><span>Gilbert</span><span>Chandler</span><span>Mesa</span></div></div>
          <div className="map-card" aria-label="Stylized East Valley service area map"><div className="map-road road-one"/><div className="map-road road-two"/><span className="map-pin pin-one">Gilbert</span><span className="map-pin pin-two">Mesa</span><span className="map-pin pin-three">Chandler</span><strong>NRS Service Area</strong></div>
        </div>
      </section>

      <section id="faq" className="section alt">
        <div className="container faq-grid">
          <div><span className="eyebrow">Good to know</span><h2>Frequently asked questions.</h2><p className="muted">The booking flow will show current inventory and availability for your date.</p></div>
          <div className="faq-list">
            <details open><summary>How long is a rental?</summary><p>Pricing is shown as a full-day rental. Exact delivery and pickup windows are confirmed with your booking.</p></details>
            <details><summary>Are the inflatables cleaned?</summary><p>Yes. Equipment is cleaned, sanitized, and inspected before each rental.</p></details>
            <details><summary>What happens if it rains?</summary><p>Weather can affect safe setup. NRS will communicate available options when unsafe conditions are expected.</p></details>
            <details><summary>What do I need at the event site?</summary><p>A clear, level setup area and access to an appropriate power source are typically required. Product-specific details can be confirmed before delivery.</p></details>
            <details><summary>Can I book more than one item?</summary><p>Yes. The multi-item booking and quantity inventory features are already included in the booking experience.</p></details>
          </div>
        </div>
      </section>

      <section className="cta-section"><div className="container cta-card"><div><span className="eyebrow">Ready to make some memories?</span><h2>Let’s get your party started.</h2><p>Choose your rental, select a date, and reserve securely online.</p></div><Link className="button light-button" href="/book">Reserve Now</Link></div></section>

      <div className="mobile-book-bar"><Link href="/book">Reserve Now</Link></div>
    </main>
  );
}
