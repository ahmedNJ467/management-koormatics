export interface InterestPoint {
  id: string;
  name: string;
  description?: string;
  category: InterestPointCategory;
  latitude: number;
  longitude: number;
  icon: string;
  icon_url?: string; // URL to custom uploaded icon
  color: string;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export type InterestPointCategory =
  | "places"
  | "checkpoints"
  | "market"
  | "security"
  | "fuel"
  | "health"
  | "restaurant"
  | "hotel"
  | "bank"
  | "school"
  | "mosque"
  | "general";

export interface CreateInterestPointData {
  name: string;
  description?: string;
  category: InterestPointCategory;
  latitude: number | string;
  longitude: number | string;
  icon?: string;
  icon_url?: string; // URL to custom uploaded icon
  color?: string;
}

export interface UpdateInterestPointData {
  name?: string;
  description?: string;
  category?: InterestPointCategory;
  latitude?: number;
  longitude?: number;
  icon?: string;
  icon_url?: string; // URL to custom uploaded icon
  color?: string;
  is_active?: boolean;
}

export const INTEREST_POINT_CATEGORIES: {
  value: InterestPointCategory;
  label: string;
  icon: string;
  color: string;
}[] = [
  { value: "places", label: "Places", icon: "📍", color: "#2563EB" },
  { value: "checkpoints", label: "Checkpoints", icon: "🚧", color: "#0891B2" },
  { value: "market", label: "Market", icon: "🛒", color: "#EA580C" },
  { value: "security", label: "Security", icon: "🚨", color: "#DC2626" },
  { value: "fuel", label: "Fuel Station", icon: "⛽", color: "#CA8A04" },
  { value: "health", label: "Health", icon: "🏥", color: "#7C3AED" },
  { value: "restaurant", label: "Restaurant", icon: "🍽️", color: "#E11D48" },
  { value: "hotel", label: "Hotel", icon: "🏨", color: "#16A34A" },
  { value: "bank", label: "Bank", icon: "🏦", color: "#0D9488" },
  { value: "school", label: "School", icon: "🏫", color: "#D97706" },
  { value: "mosque", label: "Mosque", icon: "🕌", color: "#9333EA" },
  { value: "general", label: "General", icon: "📍", color: "#64748B" },
];

export const getCategoryInfo = (category: InterestPointCategory) => {
  return (
    INTEREST_POINT_CATEGORIES.find((cat) => cat.value === category) ||
    INTEREST_POINT_CATEGORIES[INTEREST_POINT_CATEGORIES.length - 1]
  );
};
