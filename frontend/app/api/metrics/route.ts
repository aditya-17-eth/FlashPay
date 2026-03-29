import { getServiceSupabase } from "@/lib/supabase";
import { captureException } from "@/lib/sentry";

export async function GET(req: Request) {
  try {
    const supabase = getServiceSupabase();

    const [{ count: totalUsers, error: usersError }, { count: totalRuns, error: runsError }] =
      await Promise.all([
        supabase.from("users").select("*", { count: "exact", head: true }),
        supabase.from("transactions").select("*", { count: "exact", head: true }),
      ]);

    if (usersError) throw usersError;
    if (runsError) throw runsError;

    const [
      { count: imageCount, error: imageError },
      { count: summariseCount, error: summariseError },
      { count: pdfCount, error: pdfError },
      { count: codeCount, error: codeError },
      { data: releasedTransactions, error: volumeError },
    ] = await Promise.all([
      supabase.from("transactions").select("*", { count: "exact", head: true }).eq("tool", "image"),
      supabase.from("transactions").select("*", { count: "exact", head: true }).eq("tool", "summarise"),
      supabase.from("transactions").select("*", { count: "exact", head: true }).eq("tool", "pdf"),
      supabase.from("transactions").select("*", { count: "exact", head: true }).eq("tool", "code"),
      supabase.from("transactions").select("amount_usdc").eq("status", "released"),
    ]);

    if (imageError) throw imageError;
    if (summariseError) throw summariseError;
    if (pdfError) throw pdfError;
    if (codeError) throw codeError;
    if (volumeError) throw volumeError;

    const totalVolume =
      releasedTransactions?.reduce((sum, tx) => sum + Number(tx.amount_usdc || 0), 0) || 0;

    return Response.json({
      totalUsers: totalUsers || 0,
      totalRuns: totalRuns || 0,
      totalVolumeUsdc: totalVolume,
      toolBreakdown: {
        image: imageCount || 0,
        summarise: summariseCount || 0,
        pdf: pdfCount || 0,
        code: codeCount || 0,
      },
    });
  } catch (error) {
    captureException(error);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
