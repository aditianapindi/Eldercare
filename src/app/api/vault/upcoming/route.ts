import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase-server";

/** GET — unified "what's coming up" feed for the next 90 days.
 *  Merges: upcoming medical_events + insurance/asset renewals + medicines ending soon.
 *  RLS handles vault sharing automatically. */
export async function GET(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const today = new Date();
  const ninety = new Date();
  ninety.setDate(ninety.getDate() + 90);
  const todayISO = today.toISOString().slice(0, 10);
  const endISO = ninety.toISOString().slice(0, 10);

  const [eventsRes, assetsRes, medsRes, parentsRes] = await Promise.all([
    auth.supabase
      .from("medical_events")
      .select("id, parent_id, event_type, title, event_date, doctor, hospital")
      .gte("event_date", todayISO)
      .lte("event_date", endISO)
      .order("event_date", { ascending: true }),
    auth.supabase
      .from("financial_assets")
      .select("id, parent_id, asset_type, institution, description, renewal_date")
      .not("renewal_date", "is", null)
      .gte("renewal_date", todayISO)
      .lte("renewal_date", endISO)
      .order("renewal_date", { ascending: true }),
    auth.supabase
      .from("medicines")
      .select("id, parent_id, name, end_date, is_lifelong, active")
      .eq("active", true)
      .eq("is_lifelong", false)
      .not("end_date", "is", null)
      .gte("end_date", todayISO)
      .lte("end_date", endISO)
      .order("end_date", { ascending: true }),
    auth.supabase.from("parents").select("id, label"),
  ]);

  const parents = parentsRes.data || [];
  const parentLabel = (id: string | null) => parents.find((p) => p.id === id)?.label || "Shared";

  type UpcomingItem = {
    id: string;
    kind: "appointment" | "renewal" | "medicine";
    title: string;
    subtitle: string | null;
    date: string;
    parent_id: string | null;
    parent_label: string;
  };

  const items: UpcomingItem[] = [];

  for (const e of eventsRes.data || []) {
    items.push({
      id: `event-${e.id}`,
      kind: "appointment",
      title: e.title || e.event_type || "Appointment",
      subtitle: [e.doctor, e.hospital].filter(Boolean).join(" · ") || null,
      date: e.event_date,
      parent_id: e.parent_id,
      parent_label: parentLabel(e.parent_id),
    });
  }

  for (const a of assetsRes.data || []) {
    items.push({
      id: `asset-${a.id}`,
      kind: "renewal",
      title: `${a.asset_type} renewal`,
      subtitle: [a.institution, a.description].filter(Boolean).join(" · ") || null,
      date: a.renewal_date!,
      parent_id: a.parent_id,
      parent_label: parentLabel(a.parent_id),
    });
  }

  for (const m of medsRes.data || []) {
    items.push({
      id: `med-${m.id}`,
      kind: "medicine",
      title: `${m.name} course ends`,
      subtitle: null,
      date: m.end_date!,
      parent_id: m.parent_id,
      parent_label: parentLabel(m.parent_id),
    });
  }

  items.sort((a, b) => a.date.localeCompare(b.date));

  return NextResponse.json(items);
}
