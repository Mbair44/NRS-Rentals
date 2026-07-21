import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "NRS Party Rentals | Bounce House Rentals in Gilbert, Chandler & Mesa",
  description: "Instant online booking for bounce-house rentals in Gilbert, Chandler, and Mesa, Arizona."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="header">
          <div className="container nav">
            <Link className="brand" href="/" aria-label="NRS Party Rentals home">
              <img className="brand-logo" src="/nrs-logo.png" alt="NRS Party Rentals" />
            </Link>
            <nav className="navlinks">
              <Link href="/#rental">Rental</Link>
              <Link href="/book">Availability</Link>
              <Link href="/#service-area">Service Area</Link>
              <Link className="button small" href="/book">Book Now</Link>
            </nav>
          </div>
        </header>
        {children}
        <footer>
          <div className="container">
            <img className="footer-logo" src="/nrs-logo.png" alt="NRS Party Rentals" />
            <p>Bounce-house rentals in Gilbert, Chandler, and Mesa, Arizona.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
