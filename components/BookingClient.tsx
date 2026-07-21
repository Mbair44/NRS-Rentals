"use client";

import { useMemo, useState } from "react";

type InventoryItem = {
  id: string;
  name: string;
  description: string | null;
  daily_price_cents: number;
  image_url: string | null;
};

type AvailabilityMap = Record<string, string[]>;

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
  inventory,
  unavailableDatesByItem,
  initialItemIds,
}: {
  inventory: InventoryItem[];
  unavailableDatesByItem: AvailabilityMap;
  initialItemIds: string[];
}) {
  const validInitialIds = initialItemIds.filter((id) => inventory.some((item) => item.id === id));
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>(
    validInitialIds.length > 0 ? validInitialIds : inventory[0] ? [inventory[0].id] : []
  );
  const [viewDate, setViewDate] = useState(() => {
    const date = new Date();
    date.setDate(1);
    return date;
  });
  const [selectedDate, setSelectedDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const selectedItems = useMemo(
    () => inventory.filter((item) => selectedItemIds.includes(item.id)),
    [inventory, selectedItemIds]
  );

  const unavailableForSelection = useMemo(() => {
    const dates = new Set<string>();
    for (const itemId of selectedItemIds) {
      for (const date of unavailableDatesByItem[itemId] ?? []) dates.add(date);
    }
    return dates;
  }, [selectedItemIds, unavailableDatesByItem]);

  const total = selectedItems.reduce((sum, item) => sum + item.daily_price_cents, 0);
  const deposit = selectedItems.reduce(
    (sum, item) => sum + Math.round(item.daily_price_cents * 0.25),
    0
  );
  const balance = total - deposit;

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const count = new Date(year, month + 1, 0).getDate();

  function isPast(day: number) {
    const d = new Date(year, month, day);
    d.setHours(23, 59, 59, 999);
    return d < new Date();
  }

  function toggleItem(itemId: string) {
    setSelectedItemIds((current) => {
      const next = current.includes(itemId)
        ? current.filter((id) => id !== itemId)
        : [...current, itemId];
      if (selectedDate) {
        const dateUnavailable = next.some((id) =>
          (unavailableDatesByItem[id] ?? []).includes(selectedDate)
        );
        if (dateUnavailable) setSelectedDate("");
      }
      return next;
    });
  }

  async function submit(formData: FormData) {
    if (selectedItemIds.length === 0) {
      alert("Choose at least one rental item.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...Object.fromEntries(formData.entries()),
        inventoryItemIds: selectedItemIds,
      };
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

  const prettyDate = selectedDate
    ? new Date(`${selectedDate}T12:00:00`).toLocaleDateString("en-US", {
        weekday: "long", month: "long", day: "numeric", year: "numeric",
      })
    : "";

  return (
    <div>
      <section className="booking-items-section">
        <span className="eyebrow">Choose your rentals</span>
        <h1 className="booking-title">Build your party package.</h1>
        <p className="lead">
          Select one or more items. Each item can only be added once, and every selected item must
          be available on the same rental date.
        </p>
        <div className="inventory-gallery">
          {inventory.map((item) => {
            const selected = selectedItemIds.includes(item.id);
            return (
              <button
                type="button"
                className={`inventory-card ${selected ? "selected" : ""}`}
                key={item.id}
                onClick={() => toggleItem(item.id)}
                aria-pressed={selected}
              >
                {item.image_url ? (
                  <img src={item.image_url} alt={item.name} />
                ) : (
                  <div className="inventory-image-placeholder">Photo coming soon</div>
                )}
                <div className="inventory-card-body">
                  <div className="inventory-card-head">
                    <h3>{item.name}</h3>
                    <span className="item-check">{selected ? "✓" : "+"}</span>
                  </div>
                  {item.description && <p className="muted">{item.description}</p>}
                  <strong>{money(item.daily_price_cents)} per day</strong>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <div className="booking-shell">
        <div>
          <span className="eyebrow">Live availability</span>
          <h2>Choose one date for all selected items.</h2>
          <p className="muted">
            Green dates are open for your entire package. Red dates mean at least one selected item
            is booked or blocked. Availability is checked again before checkout to prevent double bookings.
          </p>
          <div className="legend">
            <span><i className="dot available" />Available</span>
            <span><i className="dot booked" />Unavailable</span>
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
                const unavailable = selectedItemIds.length === 0 || unavailableForSelection.has(iso);
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
          <div className="selected-summary">
            <strong>{selectedItems.length} item{selectedItems.length === 1 ? "" : "s"} selected</strong>
            {selectedItems.map((item) => (
              <div className="summary-line" key={item.id}>
                <span>{item.name}</span><span>{money(item.daily_price_cents)}</span>
              </div>
            ))}
            <div className="summary-total"><span>Rental total</span><strong>{money(total)}</strong></div>
            <div className="summary-line"><span>25% deposit due now</span><strong>{money(deposit)}</strong></div>
            <div className="summary-line"><span>Remaining balance</span><strong>{money(balance)}</strong></div>
          </div>
          <input type="hidden" name="rentalDate" value={selectedDate} />
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
            <span><input type="checkbox" name="agreementAccepted" value="true" required className="inline-checkbox" />I agree to the rental agreement and safety rules.</span>
          </label>
          <label>
            <span><input type="checkbox" name="depositAccepted" value="true" required className="inline-checkbox" />I understand the 25% reservation deposit is non-refundable and the remaining balance is still due under the rental agreement.</span>
          </label>
          <button className="button" type="submit" disabled={!selectedDate || selectedItemIds.length === 0 || submitting}>
            {submitting ? "Opening secure checkout..." : `Pay ${money(deposit)} deposit`}
          </button>
          <p className="muted checkout-note">Secure payment is processed by Stripe. Your reservation is confirmed only after payment succeeds.</p>
        </form>
      </div>
    </div>
  );
}
