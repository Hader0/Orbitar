export type PlanKey = "free" | "light" | "pro" | "admin";

export function normalizePlan(rawPlan: string | null | undefined): PlanKey {
  const p = (rawPlan || "").toLowerCase().trim();

  if (p === "free") return "free";
  if (p === "builder" || p === "light") return "light";
  if (p === "pro") return "pro";
  if (p === "admin") return "admin";

  return "free";
}

export function planLabel(plan: PlanKey): string {
  if (plan === "admin") return "Admin";
  if (plan === "pro") return "Pro";
  if (plan === "light") return "Light";
  return "Free";
}

/**
 * Compute canonical PlanKey for a user.
 * - Admin email (env ADMIN_EMAIL) always maps to "admin" for UI and logging.
 * - Otherwise, use normalizePlan(user.plan).
 */
export function getPlanKeyForUser(
  user: { plan?: string | null; email?: string | null },
  adminEmail?: string | null
): PlanKey {
  const email = (user.email || "").toLowerCase().trim();
  const admin = (adminEmail || "").toLowerCase().trim();

  if (admin && email && email === admin) {
    return "admin";
  }

  return normalizePlan(user.plan);
}
