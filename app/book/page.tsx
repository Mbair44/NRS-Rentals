import BookingClient from "@/components/BookingClient";
import { getUnavailableDates } from "@/lib/bookings";
import { getActiveInventory } from "@/lib/inventory";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ item?: string }>;
};

function iso(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default async function BookPage({ searchParams }: Props) {
  const params = await searchParams;
  const inventory = await getActiveInventory();
  const selectedItem = inventory.find((item) => item.id === params.item) ?? inventory[0];

  if (!selectedItem) {
    return (
      <main className="section alt">
        <div className="container card">
          <h2>No active rental inventory was found.</h2>
          <p>Confirm that the Classic Bounce House is active in Supabase.</p>
        </div>
      </main>
    );
  }

  const start = new Date();
  start.setDate(1);
  const end = new Date(start.getFullYear(), start.getMonth() + 13, 0);
  const unavailableDates = await getUnavailableDates(selectedItem.id, iso(start), iso(end));

  return (
    <main className="section alt">
      <div className="container">
        <BookingClient
          unavailableDates={unavailableDates}
          inventoryItem={selectedItem}
        />
      </div>
    </main>
  );
}
