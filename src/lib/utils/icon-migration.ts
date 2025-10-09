// Utility to help migrate existing interest points from emoji icons to Google Material Icons
// This can be used to update existing data in the database

export const EMOJI_TO_GOOGLE_ICON_MAP: Record<string, string> = {
  // Places
  "📍": "place",
  "🏙️": "location_city",
  "🏠": "home",
  "🏢": "business",
  "🏪": "store",
  "🏛️": "account_balance",
  "🏞️": "park",
  "🏖️": "beach_access",
  "⛰️": "terrain",

  // Checkpoints/Security
  "🚧": "construction",
  "🚨": "warning",
  "🛡️": "shield",
  "👮": "local_police",
  "⚖️": "gavel",
  "🔒": "lock",
  "✅": "check_circle",
  "🔐": "lock_outline",

  // Market
  "🛒": "shopping_cart",
  // duplicate removed
  // "🏪": "store",
  "🏬": "local_mall",
  "📦": "inventory",
  "🚚": "local_shipping",

  // Fuel
  "⛽": "local_gas_station",
  "🔥": "local_fire_department",
  "🛢️": "oil_barrel",

  // Health
  "🏥": "local_hospital",
  "💊": "medication",
  "🚑": "emergency",
  "💉": "vaccines",
  "🩺": "medical_services",

  // Restaurant
  "🍽️": "restaurant",
  "☕": "coffee",
  "🍕": "local_pizza",
  "🍜": "ramen_dining",
  "🍦": "icecream",
  "🥖": "bakery_dining",

  // Hotel
  "🏨": "hotel",
  "🛏️": "bed",
  "🍽️": "room_service",
  "❄️": "ac_unit",
  "🏊": "pool",
  "📶": "wifi",

  // Bank
  "🏦": "account_balance",
  "💳": "credit_card",
  "💰": "savings",
  "🏧": "atm",
  "💵": "attach_money",

  // School
  "🏫": "school",
  "📚": "library_books",
  "📖": "menu_book",
  "🔬": "science",
  "💻": "computer",
  "⚽": "sports_soccer",
  "🎵": "music_note",
  "🎨": "palette",
  "🧠": "psychology",

  // Mosque/Religion
  "🕌": "mosque",
  "⛪": "church",
  "🕍": "synagogue",
  "🕉️": "spa",
  "🧘": "self_improvement",
  "🌿": "nature_people",

  // General
  "⭐": "star",
  "❤️": "favorite",
  "🔖": "bookmark",
  "🚩": "flag",
  "📌": "push_pin",
  "🗺️": "map",
  "🧭": "navigation",
  "➡️": "directions",
  "🔍": "search",
  "➕": "add",
  "✏️": "edit",
  "🗑️": "delete",
  "👁️": "visibility",
  "👁️‍🗨️": "visibility_off",
};

export function getGoogleIconFromEmoji(emoji: string): string {
  return EMOJI_TO_GOOGLE_ICON_MAP[emoji] || "place";
}

export function migrateInterestPointIcons(interestPoints: any[]): any[] {
  return interestPoints.map((point) => ({
    ...point,
    icon: getGoogleIconFromEmoji(point.icon),
  }));
}

// SQL query to update existing interest points
export const MIGRATION_SQL = `
-- Update existing interest points to use Google Material Icons
UPDATE interest_points 
SET icon = CASE icon
  WHEN '📍' THEN 'place'
  WHEN '🏙️' THEN 'location_city'
  WHEN '🏠' THEN 'home'
  WHEN '🏢' THEN 'business'
  WHEN '🏪' THEN 'store'
  WHEN '🏛️' THEN 'account_balance'
  WHEN '🏞️' THEN 'park'
  WHEN '🏖️' THEN 'beach_access'
  WHEN '⛰️' THEN 'terrain'
  WHEN '🚧' THEN 'construction'
  WHEN '🚨' THEN 'warning'
  WHEN '🛡️' THEN 'shield'
  WHEN '👮' THEN 'local_police'
  WHEN '⚖️' THEN 'gavel'
  WHEN '🔒' THEN 'lock'
  WHEN '✅' THEN 'check_circle'
  WHEN '🔐' THEN 'lock_outline'
  WHEN '🛒' THEN 'shopping_cart'
  WHEN '🏬' THEN 'local_mall'
  WHEN '📦' THEN 'inventory'
  WHEN '🚚' THEN 'local_shipping'
  WHEN '⛽' THEN 'local_gas_station'
  WHEN '🔥' THEN 'local_fire_department'
  WHEN '🛢️' THEN 'oil_barrel'
  WHEN '🏥' THEN 'local_hospital'
  WHEN '💊' THEN 'medication'
  WHEN '🚑' THEN 'emergency'
  WHEN '💉' THEN 'vaccines'
  WHEN '🩺' THEN 'medical_services'
  WHEN '🍽️' THEN 'restaurant'
  WHEN '☕' THEN 'coffee'
  WHEN '🍕' THEN 'local_pizza'
  WHEN '🍜' THEN 'ramen_dining'
  WHEN '🍦' THEN 'icecream'
  WHEN '🥖' THEN 'bakery_dining'
  WHEN '🏨' THEN 'hotel'
  WHEN '🛏️' THEN 'bed'
  WHEN '❄️' THEN 'ac_unit'
  WHEN '🏊' THEN 'pool'
  WHEN '📶' THEN 'wifi'
  WHEN '🏦' THEN 'account_balance'
  WHEN '💳' THEN 'credit_card'
  WHEN '💰' THEN 'savings'
  WHEN '🏧' THEN 'atm'
  WHEN '💵' THEN 'attach_money'
  WHEN '🏫' THEN 'school'
  WHEN '📚' THEN 'library_books'
  WHEN '📖' THEN 'menu_book'
  WHEN '🔬' THEN 'science'
  WHEN '💻' THEN 'computer'
  WHEN '⚽' THEN 'sports_soccer'
  WHEN '🎵' THEN 'music_note'
  WHEN '🎨' THEN 'palette'
  WHEN '🧠' THEN 'psychology'
  WHEN '🕌' THEN 'mosque'
  WHEN '⛪' THEN 'church'
  WHEN '🕍' THEN 'synagogue'
  WHEN '🕉️' THEN 'spa'
  WHEN '🧘' THEN 'self_improvement'
  WHEN '🌿' THEN 'nature_people'
  WHEN '⭐' THEN 'star'
  WHEN '❤️' THEN 'favorite'
  WHEN '🔖' THEN 'bookmark'
  WHEN '🚩' THEN 'flag'
  WHEN '📌' THEN 'push_pin'
  WHEN '🗺️' THEN 'map'
  WHEN '🧭' THEN 'navigation'
  WHEN '➡️' THEN 'directions'
  WHEN '🔍' THEN 'search'
  WHEN '➕' THEN 'add'
  WHEN '✏️' THEN 'edit'
  WHEN '🗑️' THEN 'delete'
  WHEN '👁️' THEN 'visibility'
  WHEN '👁️‍🗨️' THEN 'visibility_off'
  ELSE 'place'
END;
`;
