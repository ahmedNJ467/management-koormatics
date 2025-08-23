export const MANAGER_ROLE_OPTIONS = [
  { value: "fleet_manager", label: "Fleet manager" },
  { value: "operations_manager", label: "Operations manager" },
  { value: "finance_manager", label: "Finance manager" },
] as const;

export type ManagerRoleSlug = (typeof MANAGER_ROLE_OPTIONS)[number]["value"];
