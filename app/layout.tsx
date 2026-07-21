import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "NRS Party Rentals | Inflatable Rentals in Gilbert, Chandler & Mesa",
  description: "Clean, affordable inflatable party rentals with online booking for Gilbert, Chandler, and Mesa, Arizona.",
  keywords: ["bounce house rentals Gilbert", "water slide rentals Mesa", "party rentals Chandler", "inflatable rentals East Valley"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en"><body>
      <header className="header"><div className="container nav">
        <Link className="brand" href="/" aria-label="NRS Party Rentals home"><img className="brand-logo" src="/nrs-logo.png" alt="NRS Party Rentals" /></Link>
        <nav className="navlinks" aria-label="Main navigation"><Link href="/#rentals">Rentals</Link><Link href="/#how-it-works">How It Works</Link><Link href="/#service-area">Service Area</Link><Link href="/#faq">FAQ</Link><Link className="button small" href="/book">Book Now</Link></nav>
      </div></header>
      {children}
      <footer><div className="container footer-grid">
        <div><img className="footer-logo" src="/nrs-logo.png" alt="NRS Party Rentals" /><p>Clean, affordable inflatable rentals for memorable East Valley events.</p></div>
        <div><h3>Explore</h3><Link href="/#rentals">Rentals</Link><Link href="/book">Availability</Link><Link href="/#faq">FAQ</Link></div>
        <div><h3>Service Area</h3><span>Gilbert</span><span>Chandler</span><span>Mesa</span></div>
        <div><h3>Booking</h3><p>Reserve online anytime. Contact and event details are collected securely during checkout.</p></div>
      </div><div className="container footer-bottom"><span>© {new Date().getFullYear()} NRS Party Rentals</span><span>Built for easy celebrations.</span></div></footer>
    </body></html>
  );
}
