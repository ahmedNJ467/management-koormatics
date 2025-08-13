export type AppDomain = "management" | "fleet" | "operations" | "finance";

export function getSubdomainFromHost(hostname: string): AppDomain {
  // In production: subdomain.example.com → take first label
  // In dev (localhost), default to management unless VITE_APP_SUBDOMAIN is set
  if (!hostname || hostname === "localhost" || hostname.startsWith("127.")) {
    const override = (import.meta as any).env?.VITE_APP_SUBDOMAIN as
      | AppDomain
      | undefined;
    return override || "management";
  }

  const firstLabel = hostname.split(".")[0]?.toLowerCase();
  switch (firstLabel) {
    case "fleet":
      return "fleet";
    case "operations":
      return "operations";
    case "finance":
      return "finance";
    case "management":
    default:
      return "management";
  }
}
