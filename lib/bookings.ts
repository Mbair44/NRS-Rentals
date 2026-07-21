import { getSupabasePublic } from "./supabasePublic";

export async function getUnavailableDates(
  inventoryItemId: string,
  startDate: string,
  endDate: string
): Promise<{ rental_date: string }[]> {
  const supabase = getSupabasePublic();
  if (!supabase) return [];

  const { data, error } = await supabase.rpc("get_unavailable_dates", {
    p_inventory_item_id: inventoryItemId,
    p_start_date: startDate,
    p_end_date: endDate,
  });

  if (error) {
    console.error("Could not load availability:", error.message);
    return [];
  }

  return (data ?? []).map((row: { rental_date: string }) => ({
    rental_date: row.rental_date,
  }));
}
