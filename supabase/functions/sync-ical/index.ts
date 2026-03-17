import { createClient } from "npm:@supabase/supabase-js@^2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ICalEvent {
  uid: string;
  startDate: string;
  endDate: string;
  summary: string;
  description?: string;
  status?: string;
}

function parseICalDate(dateStr: string): string {
  const clean = dateStr.replace(/\s+/g, "");

  if (clean.includes("T")) {
    const datePart = clean.split("T")[0];
    if (datePart.length === 8) {
      return `${datePart.substring(0, 4)}-${datePart.substring(4, 6)}-${datePart.substring(6, 8)}`;
    }
    return datePart;
  }

  if (clean.length === 8) {
    return `${clean.substring(0, 4)}-${clean.substring(4, 6)}-${clean.substring(6, 8)}`;
  }

  return clean;
}

function parseICalContent(icalContent: string): ICalEvent[] {
  const events: ICalEvent[] = [];
  const lines = icalContent.split(/\r?\n/);

  let currentEvent: Partial<ICalEvent> | null = null;
  let currentKey = "";
  let currentValue = "";

  for (const line of lines) {
    if (line.startsWith(" ") || line.startsWith("\t")) {
      currentValue += line.substring(1);
      continue;
    }

    if (currentKey && currentEvent) {
      applyProperty(currentEvent, currentKey, currentValue);
    }

    const colonIndex = line.indexOf(":");
    if (colonIndex === -1) continue;

    currentKey = line.substring(0, colonIndex).split(";")[0];
    currentValue = line.substring(colonIndex + 1);

    if (currentKey === "BEGIN" && currentValue === "VEVENT") {
      currentEvent = {};
    } else if (currentKey === "END" && currentValue === "VEVENT") {
      if (currentEvent) {
        applyProperty(currentEvent, currentKey, currentValue);
      }

      const status = (currentEvent?.status || "").toUpperCase();
      const isCancelled = status === "CANCELLED" || status === "TENTATIVE";

      if (
        currentEvent &&
        currentEvent.uid &&
        currentEvent.startDate &&
        currentEvent.endDate &&
        !isCancelled
      ) {
        events.push(currentEvent as ICalEvent);
      }
      currentEvent = null;
      currentKey = "";
      currentValue = "";
    }
  }

  return events;
}

function applyProperty(
  event: Partial<ICalEvent>,
  key: string,
  value: string
): void {
  switch (key) {
    case "UID":
      event.uid = value.trim();
      break;
    case "DTSTART":
      event.startDate = parseICalDate(value);
      break;
    case "DTEND":
      event.endDate = parseICalDate(value);
      break;
    case "SUMMARY":
      event.summary = value.replace(/\\,/g, ",").replace(/\\n/g, "\n").trim();
      break;
    case "DESCRIPTION":
      event.description = value
        .replace(/\\,/g, ",")
        .replace(/\\n/g, "\n")
        .trim();
      break;
    case "STATUS":
      event.status = value.trim();
      break;
  }
}

async function fetchWithTimeout(
  url: string,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Petricani22-CalSync/1.0 (iCal feed reader)",
        Accept: "text/calendar, text/plain, */*",
      },
    });
    return response;
  } finally {
    clearTimeout(timer);
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let feedId: string | undefined;

    if (req.method === "POST") {
      try {
        const body = await req.json();
        feedId = body.feed_id;
      } catch {
        // empty body is fine for cron triggers
      }
    }

    let query = supabase
      .from("ical_feeds")
      .select("*")
      .eq("is_active", true);

    if (feedId) {
      query = query.eq("id", feedId);
    }

    const { data: feeds, error: feedsError } = await query;

    if (feedsError) {
      throw new Error(`Failed to fetch feeds: ${feedsError.message}`);
    }

    const results: Array<{
      feed_id: string;
      feed_name: string;
      platform: string;
      success: boolean;
      events_found?: number;
      events_imported?: number;
      error?: string;
    }> = [];

    for (const feed of feeds || []) {
      try {
        const response = await fetchWithTimeout(feed.feed_url, 15000);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const icalContent = await response.text();

        if (!icalContent.includes("BEGIN:VCALENDAR")) {
          throw new Error(
            "Invalid iCal response: missing BEGIN:VCALENDAR header"
          );
        }

        const events = parseICalContent(icalContent);

        const eventsToInsert = events.map((event) => ({
          ical_feed_id: feed.id,
          uid: event.uid,
          start_date: event.startDate,
          end_date: event.endDate,
          summary: event.summary || "Blocked",
          description: event.description || null,
          source_platform: feed.platform,
          raw_data: event,
          synced_at: new Date().toISOString(),
        }));

        const { error: deleteError } = await supabase
          .from("ical_events")
          .delete()
          .eq("ical_feed_id", feed.id);

        if (deleteError) {
          throw new Error(
            `Failed to clear old events: ${deleteError.message}`
          );
        }

        let importedCount = 0;
        if (eventsToInsert.length > 0) {
          const { error: insertError } = await supabase
            .from("ical_events")
            .insert(eventsToInsert);

          if (insertError) {
            throw new Error(
              `Failed to insert events: ${insertError.message}`
            );
          }
          importedCount = eventsToInsert.length;
        }

        await supabase
          .from("ical_feeds")
          .update({
            last_synced_at: new Date().toISOString(),
            sync_status: "success",
            sync_error: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", feed.id);

        results.push({
          feed_id: feed.id,
          feed_name: feed.feed_name,
          platform: feed.platform,
          success: true,
          events_found: events.length,
          events_imported: importedCount,
        });
      } catch (feedError) {
        const errorMessage =
          feedError instanceof Error ? feedError.message : "Unknown error";

        await supabase
          .from("ical_feeds")
          .update({
            sync_status: "error",
            sync_error: errorMessage,
            updated_at: new Date().toISOString(),
          })
          .eq("id", feed.id);

        results.push({
          feed_id: feed.id,
          feed_name: feed.feed_name,
          platform: feed.platform,
          success: false,
          error: errorMessage,
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        feeds_processed: results.length,
        results,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("iCal sync error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
