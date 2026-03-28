import { getServiceSupabase } from "@/lib/supabase";
import { captureException } from "@/lib/sentry";

export async function POST(req: Request) {
  try {
    const { wallet } = await req.json();
    if (!wallet || typeof wallet !== "string" || !wallet.startsWith("G") || wallet.length !== 56) {
      return Response.json({ error: "Invalid wallet" }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    
    // Upsert equivalent ignoring conflict
    const { error: insertErr } = await supabase
      .from("users")
      .insert({ wallet })
      .select();

    if (insertErr && insertErr.code !== '23505') { // Ignore unique constraint violation
        throw insertErr;
    }

    // Update last_seen
    await supabase.from("users").update({ last_seen: new Date().toISOString() }).eq("wallet", wallet);
    
    return Response.json({ success: true });
  } catch (error) {
    captureException(error);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
