import BookingClient from "@/components/BookingClient";
import { getUnavailableDates } from "@/lib/bookings";
import { getActiveInventory } from "@/lib/inventory";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ item?: string; items?: string }>;
};

function iso(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default async function BookPage({ searchParams }: Props) {
  const params = await searchParams;
  const inventory = await getActiveInventory();

  if (inventory.length === 0) {
    return (
      <main className="section alt">
        <div className="container card">
          <h2>No active rental inventory was found.</h2>
          <p>Confirm that at least one inventory item is active in Supabase.</p>
        </div>
      </main>
    );
  }

  const requestedIds = (params.items ?? params.item ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  const validIds = requestedIds.filter((id) => inventory.some((item) => item.id === id));
  const initialItemIds = validIds.length > 0 ? [...new Set(validIds)] : [inventory[0].id];

  const start = new Date();
  start.setDate(1);
  const end = new Date(start.getFullYear(), start.getMonth() + 13, 0);

  const availabilityResults = await Promise.all(
    inventory.map(async (item) => [
      item.id,
      (await getUnavailableDates(item.id, iso(start), iso(end))).map((row) => row.rental_date),
    ] as const)
  );
  const unavailableDatesByItem = Object.fromEntries(availabilityResults);

  return (
    <main className="section alt">
      <div className="container">
        <BookingClient
          inventory={inventory}
          unavailableDatesByItem={unavailableDatesByItem}
          initialItemIds={initialItemIds}
        />
      </div>
    </main>
  );
}
