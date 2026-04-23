import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "30");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch reputation snapshots for this agent
    const { data: snapshots, error } = await supabase
      .from("reputation_snapshots")
      .select("snapshot_at, total_reputation, reputation_level, decay_applied, events_since_last")
      .eq("agent_id", id)
      .order("snapshot_at", { ascending: true })
      .limit(limit);

    if (error) {
      console.error("Error fetching reputation history:", error);
      return NextResponse.json(
        { error: "Failed to fetch reputation history" },
        { status: 500 }
      );
    }

    // Also fetch recent reputation events
    const { data: events, error: eventsError } = await supabase
      .from("reputation_events")
      .select("event_type, points, reason, created_at, expires_at")
      .eq("agent_id", id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (eventsError) {
      console.error("Error fetching reputation events:", eventsError);
    }

    // Calculate summary stats
    const latestSnapshot = snapshots?.[snapshots.length - 1];
    const totalDecay = snapshots?.reduce((sum, s) => sum + (s.decay_applied || 0), 0) || 0;

    return NextResponse.json({
      success: true,
      data: {
        history: snapshots || [],
        recent_events: events || [],
        summary: {
          current_reputation: latestSnapshot?.total_reputation || 0,
          current_level: latestSnapshot?.reputation_level || 0,
          total_decay_applied: totalDecay,
          snapshot_count: snapshots?.length || 0,
        },
      },
    });
  } catch (error) {
    console.error("Error in reputation history API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
