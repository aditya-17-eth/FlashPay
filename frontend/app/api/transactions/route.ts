import { getServiceSupabase } from "@/lib/supabase";
import { captureException } from "@/lib/sentry";

export async function GET(req: Request) {
  try {
    const supabase = getServiceSupabase();
    
    // Fetch latest 50 txs
    const { data: transactions, error } = await supabase
      .from("transactions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
      
    if (error) throw error;
    
    return Response.json(transactions);
  } catch (error) {
    captureException(error);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
