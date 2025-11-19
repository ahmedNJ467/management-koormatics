// All available roles in the system
export const ALL_ROLE_OPTIONS = [
  { value: "super_admin", label: "Super Administrator" },
  { value: "fleet_manager", label: "Fleet Manager" },
  { value: "operations_manager", label: "Operations Manager" },
  { value: "finance_manager", label: "Finance Manager" },
] as const;

// Manager roles (excluding super_admin for regular user creation)
export const MANAGER_ROLE_OPTIONS = [
  { value: "fleet_manager", label: "Fleet Manager" },
  { value: "operations_manager", label: "Operations Manager" },
  { value: "finance_manager", label: "Finance Manager" },
] as const;

export type ManagerRoleSlug = (typeof MANAGER_ROLE_OPTIONS)[number]["value"];
export type AllRoleSlug = (typeof ALL_ROLE_OPTIONS)[number]["value"];
