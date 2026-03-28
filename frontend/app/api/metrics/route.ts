import { getServiceSupabase } from "@/lib/supabase";
import { captureException } from "@/lib/sentry";

export async function GET(req: Request) {
  try {
    const supabase = getServiceSupabase();
    
    // Total Users
    const { count: totalUsers } = await supabase.from("users").select('*', { count: 'exact', head: true });
    
    // Total Volume
    const { data: volData } = await supabase.rpc('sum_usdc_volume'); 
    // Fallback if custom RPC isn't deployed, we can aggregate here for MVP
    let totalVolume = volData || 0;
    
    if (volData === null) {
        const { data: allTxs } = await supabase.from("transactions").select('amount_usdc').eq("status", "released");
        totalVolume = allTxs?.reduce((sum, tx) => sum + parseFloat(tx.amount_usdc), 0) || 0;
    }

    // Counts
    const { data: imageCount } = await supabase.from("transactions").select('id', { count: 'exact' }).eq("tool", "image");
    const { data: summariseCount } = await supabase.from("transactions").select('id', { count: 'exact' }).eq("tool", "summarise");
    const { data: pdfCount } = await supabase.from("transactions").select('id', { count: 'exact' }).eq("tool", "pdf");
    const { data: codeCount } = await supabase.from("transactions").select('id', { count: 'exact' }).eq("tool", "code");
    
    return Response.json({
        totalUsers: totalUsers || 0,
        totalRuns: (imageCount?.length || 0) + (summariseCount?.length || 0) + (pdfCount?.length || 0) + (codeCount?.length || 0),
        totalVolumeUsdc: totalVolume,
        toolBreakdown: {
            image: imageCount?.length || 0,
            summarise: summariseCount?.length || 0,
            pdf: pdfCount?.length || 0,
            code: codeCount?.length || 0
        }
    });

  } catch (error) {
    captureException(error);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
