"use client";

import { useMemo, useState } from "react";

type UnavailableDate = { rental_date: string };

type InventoryItem = {
  id: string;
  name: string;
  daily_price_cents: number;
};

function isoDate(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function money(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export default function BookingClient({
  unavailableDates,
  inventoryItem,
}: {
  unavailableDates: UnavailableDate[];
  inventoryItem: InventoryItem;
}) {
  const [viewDate, setViewDate] = useState(() => {
    const date = new Date();
    date.setDate(1);
    return date;
  });
  const [selectedDate, setSelectedDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const booked = useMemo(() => new Set(unavailableDates.map((x) => x.rental_date)), [unavailableDates]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const count = new Date(year, month + 1, 0).getDate();

  function isPast(day: number) {
    const d = new Date(year, month, day);
    d.setHours(23, 59, 59, 999);
    return d < new Date();
  }

  async function submit(formData: FormData) {
    setSubmitting(true);
    try {
      const payload = Object.fromEntries(formData.entries());
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not start secure checkout.");
      if (!data.url) throw new Error("Stripe did not return a checkout link.");
      window.location.assign(data.url);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  const total = inventoryItem.daily_price_cents;
  const deposit = Math.round(total * 0.25);
  const balance = total - deposit;
  const prettyDate = selectedDate
    ? new Date(`${selectedDate}T12:00:00`).toLocaleDateString("en-US", {
        weekday: "long", month: "long", day: "numeric", year: "numeric",
      })
    : "";

  return (
    <div className="booking-shell">
      <div>
        <span className="eyebrow">Live availability</span>
        <h2>Choose your rental date for {inventoryItem.name}.</h2>
        <p className="muted">
          Green dates are open. Red dates are already booked. A 25% non-refundable deposit is
          required to confirm your reservation.
        </p>
        <div className="legend">
          <span><i className="dot available" />Available</span>
          <span><i className="dot booked" />Booked</span>
          <span><i className="dot selected" />Selected</span>
        </div>

        <div className="calendar">
          <div className="calendar-head">
            <button type="button" onClick={() => setViewDate(new Date(year, month - 1, 1))}>‹</button>
            <h3>{viewDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</h3>
            <button type="button" onClick={() => setViewDate(new Date(year, month + 1, 1))}>›</button>
          </div>
          <div className="weekdays">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => <span key={d}>{d}</span>)}
          </div>
          <div className="days">
            {Array.from({ length: firstDay }).map((_, i) => <button className="day blank" disabled key={`blank-${i}`} />)}
            {Array.from({ length: count }).map((_, i) => {
              const day = i + 1;
              const iso = isoDate(year, month, day);
              const unavailable = booked.has(iso);
              const past = isPast(day);
              const classes = ["day", unavailable ? "booked" : "", past ? "past" : "", selectedDate === iso ? "selected" : ""].filter(Boolean).join(" ");
              return (
                <button
                  type="button"
                  key={iso}
                  className={classes}
                  disabled={unavailable || past}
                  onClick={() => setSelectedDate(iso)}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <form className="form-card" action={submit}>
        <h3>Complete your reservation</h3>
        <div className="notice">
          {selectedDate ? `${prettyDate} selected` : "Select an available date to continue."}
        </div>
        <div className="notice" style={{ marginTop: 12 }}>
          Rental total: <strong>{money(total)}</strong><br />
          Deposit due now: <strong>{money(deposit)}</strong><br />
          Remaining balance: <strong>{money(balance)}</strong>
        </div>
        <input type="hidden" name="rentalDate" value={selectedDate} />
        <input type="hidden" name="inventoryItemId" value={inventoryItem.id} />
        <div className="form-grid">
          <label>First name<input name="firstName" required /></label>
          <label>Last name<input name="lastName" required /></label>
          <label>Email<input name="email" type="email" required /></label>
          <label>Phone<input name="phone" type="tel" required /></label>
          <label>Event start time<input name="startTime" type="time" required /></label>
          <label>Event end time<input name="endTime" type="time" required /></label>
        </div>
        <label>Delivery address<input name="address" required /></label>
        <div className="form-grid">
          <label>
            City
            <select name="city" required defaultValue="">
              <option value="" disabled>Select city</option>
              <option>Gilbert</option><option>Chandler</option><option>Mesa</option>
            </select>
          </label>
          <label>ZIP code<input name="zipCode" required /></label>
        </div>
        <label>Event notes<textarea name="notes" rows={4} placeholder="Gate code, surface type, party details, or other notes" /></label>
        <label>
          <span>
            <input type="checkbox" name="agreementAccepted" value="true" required style={{ width: "auto", marginRight: 8 }} />
            I agree to the rental agreement and safety rules.
          </span>
        </label>
        <label>
          <span>
            <input type="checkbox" name="depositAccepted" value="true" required style={{ width: "auto", marginRight: 8 }} />
            I understand the 25% reservation deposit is non-refundable and the remaining balance is still due under the rental agreement.
          </span>
        </label>
        <button className="button" type="submit" disabled={!selectedDate || submitting}>
          {submitting ? "Opening secure checkout..." : `Pay ${money(deposit)} deposit`}
        </button>
        <p className="muted" style={{ fontSize: ".9rem" }}>
          Secure payment is processed by Stripe. Your reservation is confirmed only after payment succeeds.
        </p>
      </form>
    </div>
  );
}
