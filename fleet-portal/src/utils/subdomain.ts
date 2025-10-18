export type AppDomain = "management" | "fleet" | "operations" | "finance";

export function getSubdomainFromHost(hostname: string): AppDomain {
  // Allow explicit override in any environment (useful for multi-project deployments)
  const override = process.env.NEXT_PUBLIC_APP_SUBDOMAIN as
    | AppDomain
    | undefined;
  if (override) return override;

  // Check URL parameters for domain override (useful for testing)
  if (typeof window !== "undefined") {
    const urlParams = new URLSearchParams(window.location.search);
    const domainParam = urlParams.get("domain") as AppDomain;
    if (
      domainParam &&
      ["management", "fleet", "operations", "finance"].includes(domainParam)
    ) {
      return domainParam;
    }
  }

  // Local development defaults
  if (!hostname || hostname.startsWith("127.")) {
    return "management";
  }

  // Handle Vercel domains specifically
  if (hostname.includes("fleet-koormatics.vercel.app")) return "fleet";
  if (hostname.includes("operations-koormatics.vercel.app"))
    return "operations";
  if (hostname.includes("finance-koormatics.vercel.app")) return "finance";
  if (hostname.includes("management-koormatics.vercel.app"))
    return "management";

  const firstLabel = hostname.split(".")[0]?.toLowerCase();

  // Support both clean subdomains (fleet.example.com) and prefixed labels
  // like fleet-koormatics.vercel.app or custom domains such as fleet-koormatics.com
  if (firstLabel === "fleet" || firstLabel.startsWith("fleet-")) return "fleet";
  if (firstLabel === "operations" || firstLabel.startsWith("operations-"))
    return "operations";
  if (firstLabel === "finance" || firstLabel.startsWith("finance-"))
    return "finance";
  if (firstLabel === "management" || firstLabel.startsWith("management-"))
    return "management";

  // Default to management if no match
  return "management";
}

// Debug function to help troubleshoot domain detection
export function debugDomainDetection() {
  const hostname = window.location.hostname;
  const detectedDomain = getSubdomainFromHost(hostname);
  console.log("🔍 Domain Detection Debug:", {
    hostname,
    detectedDomain,
    fullUrl: window.location.href,
  });
  return detectedDomain;
}
