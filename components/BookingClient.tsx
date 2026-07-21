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
type SortOption = "featured" | "price-low" | "price-high" | "name";

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
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>(validInitialIds);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("featured");
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

  const visibleInventory = useMemo(() => {
    const term = search.trim().toLowerCase();
    const items = inventory.filter((item) =>
      !term || `${item.name} ${item.description ?? ""}`.toLowerCase().includes(term)
    );

    return [...items].sort((a, b) => {
      if (sort === "price-low") return a.daily_price_cents - b.daily_price_cents;
      if (sort === "price-high") return b.daily_price_cents - a.daily_price_cents;
      if (sort === "name") return a.name.localeCompare(b.name);
      return inventory.indexOf(a) - inventory.indexOf(b);
    });
  }, [inventory, search, sort]);

  const unavailableForSelection = useMemo(() => {
    const dates = new Set<string>();
    for (const itemId of selectedItemIds) {
      for (const date of unavailableDatesByItem[itemId] ?? []) dates.add(date);
    }
    return dates;
  }, [selectedItemIds, unavailableDatesByItem]);

  const total = selectedItems.reduce((sum, item) => sum + item.daily_price_cents, 0);
  const deposit = Math.round(total * 0.25);
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

  function itemUnavailableOnSelectedDate(itemId: string) {
    return Boolean(selectedDate && (unavailableDatesByItem[itemId] ?? []).includes(selectedDate));
  }

  function toggleItem(itemId: string) {
    const selected = selectedItemIds.includes(itemId);
    if (!selected && itemUnavailableOnSelectedDate(itemId)) return;

    setSelectedItemIds((current) =>
      current.includes(itemId)
        ? current.filter((id) => id !== itemId)
        : [...current, itemId]
    );
  }

  function chooseDate(date: string) {
    setSelectedDate(date);
    setSelectedItemIds((current) =>
      current.filter((id) => !(unavailableDatesByItem[id] ?? []).includes(date))
    );
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
        <div className="catalog-heading">
          <div>
            <span className="eyebrow">Party rental catalog</span>
            <h1 className="booking-title">Find the perfect setup.</h1>
            <p className="lead">Browse every rental, compare prices, and build your package in a few clicks.</p>
          </div>
          <div className="catalog-count">{inventory.length} rental{inventory.length === 1 ? "" : "s"}</div>
        </div>

        <div className="catalog-toolbar" aria-label="Product filters">
          <label className="catalog-search">
            <span>Search rentals</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Bounce house, tables, chairs..."
            />
          </label>
          <label className="catalog-sort">
            <span>Sort by</span>
            <select value={sort} onChange={(event) => setSort(event.target.value as SortOption)}>
              <option value="featured">Featured</option>
              <option value="price-low">Price: low to high</option>
              <option value="price-high">Price: high to low</option>
              <option value="name">Name: A to Z</option>
            </select>
          </label>
        </div>

        {selectedDate && (
          <div className="availability-banner">
            Showing availability for <strong>{prettyDate}</strong>. Unavailable products cannot be added.
            <button type="button" onClick={() => setSelectedDate("")}>Clear date</button>
          </div>
        )}

        {visibleInventory.length > 0 ? (
          <div className="inventory-gallery">
            {visibleInventory.map((item) => {
              const selected = selectedItemIds.includes(item.id);
              const unavailable = itemUnavailableOnSelectedDate(item.id);
              return (
                <article className={`inventory-card ${selected ? "selected" : ""} ${unavailable ? "unavailable" : ""}`} key={item.id}>
                  <div className="inventory-media">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} />
                    ) : (
                      <div className="inventory-image-placeholder">Photo coming soon</div>
                    )}
                    {selected && <span className="selected-badge">Added</span>}
                    {unavailable && !selected && <span className="unavailable-badge">Unavailable</span>}
                  </div>
                  <div className="inventory-card-body">
                    <div className="inventory-card-head">
                      <h3>{item.name}</h3>
                      <strong className="catalog-price">{money(item.daily_price_cents)}</strong>
                    </div>
                    {item.description && <p className="muted catalog-description">{item.description}</p>}
                    <button
                      type="button"
                      className={`catalog-add-button ${selected ? "selected" : ""}`}
                      onClick={() => toggleItem(item.id)}
                      disabled={unavailable && !selected}
                      aria-pressed={selected}
                    >
                      {selected ? "✓ Added to reservation" : unavailable ? "Unavailable on this date" : "+ Add to reservation"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="empty-catalog">
            <h3>No rentals match your search.</h3>
            <button type="button" onClick={() => setSearch("")}>Clear search</button>
          </div>
        )}
      </section>

      <div className={`selection-bar ${selectedItems.length ? "visible" : ""}`}>
        <div>
          <strong>{selectedItems.length} item{selectedItems.length === 1 ? "" : "s"} selected</strong>
          <span>{money(total)} rental total</span>
        </div>
        <button type="button" onClick={() => document.getElementById("reservation-details")?.scrollIntoView({ behavior: "smooth" })}>
          Choose date & continue
        </button>
      </div>

      <div className="booking-shell" id="reservation-details">
        <div>
          <span className="eyebrow">Step 2 · Choose your date</span>
          <h2>One date for your entire package.</h2>
          <p className="muted">Green dates are available for every selected item. Availability is checked again before checkout.</p>
          {selectedItems.length === 0 && <div className="notice">Add at least one rental above to see available dates.</div>}
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
                  <button type="button" key={iso} className={classes} disabled={unavailable || past} onClick={() => chooseDate(iso)}>{day}</button>
                );
              })}
            </div>
          </div>
        </div>

        <form className="form-card" action={submit}>
          <span className="eyebrow">Step 3 · Checkout</span>
          <h3>Complete your reservation</h3>
          <div className="notice">{selectedDate ? `${prettyDate} selected` : "Select an available date to continue."}</div>
          <div className="selected-summary">
            <strong>{selectedItems.length} item{selectedItems.length === 1 ? "" : "s"} selected</strong>
            {selectedItems.map((item) => (
              <div className="summary-line" key={item.id}><span>{item.name}</span><span>{money(item.daily_price_cents)}</span></div>
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
            <label>City<select name="city" required defaultValue=""><option value="" disabled>Select city</option><option>Gilbert</option><option>Chandler</option><option>Mesa</option></select></label>
            <label>ZIP code<input name="zipCode" required /></label>
          </div>
          <label>Event notes<textarea name="notes" rows={4} placeholder="Gate code, surface type, party details, or other notes" /></label>
          <label><span><input type="checkbox" name="agreementAccepted" value="true" required className="inline-checkbox" />I agree to the rental agreement and safety rules.</span></label>
          <label><span><input type="checkbox" name="depositAccepted" value="true" required className="inline-checkbox" />I understand the 25% reservation deposit is non-refundable and the remaining balance is still due under the rental agreement.</span></label>
          <button className="button" type="submit" disabled={!selectedDate || selectedItemIds.length === 0 || submitting}>{submitting ? "Opening secure checkout..." : `Pay ${money(deposit)} deposit`}</button>
          <p className="muted checkout-note">Secure payment is processed by Stripe. Your reservation is confirmed only after payment succeeds.</p>
        </form>
      </div>
    </div>
  );
}
