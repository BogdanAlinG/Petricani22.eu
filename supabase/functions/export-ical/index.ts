import { createClient } from "npm:@supabase/supabase-js@^2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

function formatICalDate(dateStr: string): string {
  return dateStr.replace(/-/g, "");
}

function formatTimestamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function generateUID(id: string, domain: string): string {
  return `${id}@${domain}`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const url = new URL(req.url);
    const accommodationSlug = url.searchParams.get("slug");

    if (!accommodationSlug) {
      return new Response("Missing accommodation slug", {
        status: 400,
        headers: corsHeaders,
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: accommodation, error: accError } = await supabase
      .from("accommodations")
      .select("id, title_en, slug")
      .eq("slug", accommodationSlug)
      .maybeSingle();

    if (accError || !accommodation) {
      return new Response("Accommodation not found", {
        status: 404,
        headers: corsHeaders,
      });
    }

    const today = new Date().toISOString().split("T")[0];

    const [bookingsResult, blockedResult, icalEventsResult] =
      await Promise.all([
        supabase
          .from("bookings")
          .select(
            "id, booking_number, check_in_date, check_out_date, guest_name, updated_at"
          )
          .eq("accommodation_id", accommodation.id)
          .neq("booking_status", "cancelled")
          .gte("check_out_date", today),
        supabase
          .from("blocked_dates")
          .select("id, start_date, end_date, reason, created_at")
          .eq("accommodation_id", accommodation.id)
          .gte("end_date", today),
        supabase
          .from("ical_events")
          .select("id, uid, start_date, end_date, summary, ical_feed_id, synced_at, ical_feed:ical_feeds!inner(accommodation_id, is_active, platform)")
          .eq("ical_feed.accommodation_id", accommodation.id)
          .eq("ical_feed.is_active", true)
          .gte("end_date", today),
      ]);

    const bookings = bookingsResult.data || [];
    const blockedDates = blockedResult.data || [];
    const icalEvents = icalEventsResult.data || [];

    const domain = url.hostname || "petricani22.eu";
    const now = new Date();
    const timestamp = formatTimestamp(now);

    const lines: string[] = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Petricani 22//Booking Calendar//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      `X-WR-CALNAME:${accommodation.title_en}`,
      "X-WR-TIMEZONE:Europe/Bucharest",
    ];

    for (const booking of bookings) {
      const uid = generateUID(booking.id, domain);
      const startDate = formatICalDate(booking.check_in_date);
      const endDate = formatICalDate(booking.check_out_date);
      const lastModified = booking.updated_at
        ? formatTimestamp(new Date(booking.updated_at))
        : timestamp;

      lines.push(
        "BEGIN:VEVENT",
        `UID:${uid}`,
        `DTSTAMP:${timestamp}`,
        `DTSTART;VALUE=DATE:${startDate}`,
        `DTEND;VALUE=DATE:${endDate}`,
        `LAST-MODIFIED:${lastModified}`,
        "SEQUENCE:0",
        `SUMMARY:Reserved - ${booking.booking_number}`,
        `DESCRIPTION:Booking ${booking.booking_number}`,
        "STATUS:CONFIRMED",
        "TRANSP:OPAQUE",
        "END:VEVENT"
      );
    }

    for (const block of blockedDates) {
      const uid = generateUID(`block-${block.id}`, domain);
      const startDate = formatICalDate(block.start_date);
      const endDateObj = new Date(block.end_date);
      endDateObj.setDate(endDateObj.getDate() + 1);
      const endDate = formatICalDate(
        endDateObj.toISOString().split("T")[0]
      );
      const lastModified = block.created_at
        ? formatTimestamp(new Date(block.created_at))
        : timestamp;

      lines.push(
        "BEGIN:VEVENT",
        `UID:${uid}`,
        `DTSTAMP:${timestamp}`,
        `DTSTART;VALUE=DATE:${startDate}`,
        `DTEND;VALUE=DATE:${endDate}`,
        `LAST-MODIFIED:${lastModified}`,
        "SEQUENCE:0",
        `SUMMARY:Blocked${block.reason ? ` - ${block.reason}` : ""}`,
        "STATUS:CONFIRMED",
        "TRANSP:OPAQUE",
        "END:VEVENT"
      );
    }

    for (const event of icalEvents) {
      const uid = generateUID(`ext-${event.id}`, domain);
      const startDate = formatICalDate(event.start_date);
      const endDate = formatICalDate(event.end_date);
      const lastModified = event.synced_at
        ? formatTimestamp(new Date(event.synced_at))
        : timestamp;
      const feed = event.ical_feed as { platform?: string } | null;
      const platform = feed?.platform || "external";

      lines.push(
        "BEGIN:VEVENT",
        `UID:${uid}`,
        `DTSTAMP:${timestamp}`,
        `DTSTART;VALUE=DATE:${startDate}`,
        `DTEND;VALUE=DATE:${endDate}`,
        `LAST-MODIFIED:${lastModified}`,
        "SEQUENCE:0",
        `SUMMARY:Reserved (${platform})`,
        "STATUS:CONFIRMED",
        "TRANSP:OPAQUE",
        "END:VEVENT"
      );
    }

    lines.push("END:VCALENDAR");

    const icalContent = lines.join("\r\n") + "\r\n";

    return new Response(icalContent, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="${accommodationSlug}.ics"`,
      },
    });
  } catch (error) {
    console.error("iCal export error:", error);

    return new Response(
      error instanceof Error ? error.message : "An unexpected error occurred",
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
});
