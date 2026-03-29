import { createClient } from "@supabase/supabase-js";

type SupabaseConfig = {
  serviceRoleKey?: string;
  supabaseKey?: string;
  supabaseUrl?: string;
};

function normalizeValue(value?: string): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function readServerEnvConfig(): SupabaseConfig {
  const config: SupabaseConfig = {
    serviceRoleKey: normalizeValue(process.env.SUPABASE_SERVICE_ROLE_KEY),
    supabaseKey: normalizeValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    supabaseUrl: normalizeValue(process.env.NEXT_PUBLIC_SUPABASE_URL),
  };

  if (typeof window !== "undefined") {
    return config;
  }

  try {
    const fs = eval("require")("node:fs") as typeof import("node:fs");
    const path = eval("require")("node:path") as typeof import("node:path");
    const envPath = path.join(process.cwd(), ".env.local");

    if (!fs.existsSync(envPath)) {
      return config;
    }

    const envContent = fs.readFileSync(envPath, "utf8");
    for (const rawLine of envContent.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) {
        continue;
      }

      const separatorIndex = line.indexOf("=");
      if (separatorIndex === -1) {
        continue;
      }

      const key = line.slice(0, separatorIndex).trim();
      const rawValue = line.slice(separatorIndex + 1).trim();
      const unquotedValue = rawValue.replace(/^['"]|['"]$/g, "");
      const value = normalizeValue(unquotedValue);

      if (!value) {
        continue;
      }

      if (key === "NEXT_PUBLIC_SUPABASE_URL") {
        config.supabaseUrl = value;
      }

      if (key === "NEXT_PUBLIC_SUPABASE_ANON_KEY") {
        config.supabaseKey = value;
      }

      if (key === "SUPABASE_SERVICE_ROLE_KEY") {
        config.serviceRoleKey = value;
      }
    }
  } catch {
    return config;
  }

  return config;
}

const clientConfig = readServerEnvConfig();

if (!clientConfig.supabaseUrl || !clientConfig.supabaseKey) {
  throw new Error("Supabase client environment variables are missing.");
}

export const supabase = createClient(clientConfig.supabaseUrl, clientConfig.supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export function getServiceSupabase() {
  const serverConfig = readServerEnvConfig();

  if (!serverConfig.supabaseUrl || !serverConfig.serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL is missing.");
  }

  return createClient(serverConfig.supabaseUrl, serverConfig.serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
