import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateApiKey, revokeApiKey } from "../actions";
import { redirect } from "next/navigation";
import { CheckoutButtons } from "./CheckoutButtons";
import { DashboardNotice } from "./DashboardNotice";
import UsageCard from "./UsageCard";
import PrivacyCard from "./PrivacyCard";
import UpgradeCard from "./UpgradeCard";

export default async function Dashboard({
  searchParams,
}: {
  searchParams?: { ak?: string; checkout?: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/api/auth/signin");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user?.email! },
    include: { apiKeys: true },
  });

  if (!user) return <div>User not found</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Orbitar Dashboard</h1>
      <DashboardNotice
        initial={
          searchParams?.ak === "gen"
            ? "API key generated"
            : searchParams?.ak === "revoked"
            ? "API key revoked"
            : searchParams?.checkout === "success"
            ? "Checkout success. Plan will update shortly."
            : searchParams?.checkout === "cancel"
            ? "Checkout canceled."
            : null
        }
      />

      <div className="grid gap-6">
        {/* Plan Info */}
        <div className="bg-white text-gray-900 p-6 rounded-lg shadow border">
          <h2 className="text-xl font-semibold mb-4">Current Plan</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold capitalize">{user.plan}</p>
              <p className="text-gray-500">
                {user.dailyUsageCount} /{" "}
                {user.plan === "free" ? 10 : user.plan === "builder" ? 75 : 500}{" "}
                requests used today
              </p>
            </div>
            {user.plan !== "pro" && <CheckoutButtons />}
          </div>
        </div>

        {/* Subscription Status */}
        <div className="bg-white text-gray-900 p-6 rounded-lg shadow border">
          <h2 className="text-xl font-semibold mb-4">Subscription</h2>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-zinc-600">Plan</div>
              <div className="text-lg font-semibold capitalize">
                {user.plan}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-zinc-600">Status</div>
              <div>
                {((s) => {
                  const label =
                    s === "active"
                      ? "Active"
                      : s === "trialing"
                      ? "Trialing"
                      : s === "past_due"
                      ? "Past due"
                      : s === "canceled"
                      ? "Canceled"
                      : s
                      ? s
                      : "Not subscribed";
                  const cls =
                    s === "active"
                      ? "bg-emerald-100 text-emerald-700"
                      : s === "trialing"
                      ? "bg-indigo-100 text-indigo-700"
                      : s === "past_due"
                      ? "bg-amber-100 text-amber-800"
                      : s === "canceled"
                      ? "bg-red-100 text-red-700"
                      : "bg-zinc-100 text-zinc-700";
                  return (
                    <span
                      className={`inline-block px-2 py-1 text-xs rounded ${cls}`}
                    >
                      {label}
                    </span>
                  );
                })((user as any).stripeSubscriptionStatus as string | null)}
              </div>
            </div>
          </div>
        </div>

        <div>
          <UpgradeCard currentPlan={user.plan} />
        </div>

        {/* API Keys */}
        <div className="bg-white text-gray-900 p-6 rounded-lg shadow border">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">API Keys</h2>
            <form action={generateApiKey}>
              <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                Generate New Key
              </button>
            </form>
          </div>

          <div className="space-y-4">
            {user.apiKeys.map((key) => (
              <div
                key={key.id}
                className={`flex items-center justify-between p-3 rounded border ${
                  key.revoked ? "bg-red-50 border-red-200" : "bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <code
                    className={`font-mono ${
                      key.revoked ? "line-through text-gray-400" : ""
                    }`}
                  >
                    {key.key}
                  </code>
                  {key.revoked && (
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">
                      Revoked
                    </span>
                  )}
                </div>
                {!key.revoked && (
                  <form action={revokeApiKey.bind(null, key.id)}>
                    <button className="text-red-600 hover:text-red-800 text-sm">
                      Revoke
                    </button>
                  </form>
                )}
              </div>
            ))}
            {user.apiKeys.length === 0 && (
              <p className="text-gray-500 italic">No API keys generated yet.</p>
            )}
          </div>
        </div>

        {/* Usage & Privacy */}
        <div className="grid gap-6 md:grid-cols-2">
          <UsageCard />
          <PrivacyCard
            initialAllowDataUse={(user as any).allowDataUse ?? false}
            initialDefaultIncognito={(user as any).defaultIncognito ?? false}
          />
        </div>

        {/* Templates link */}
        <div className="bg-white text-gray-900 p-6 rounded-lg shadow border">
          <h2 className="text-xl font-semibold mb-2">Templates</h2>
          <p className="text-sm text-zinc-600 mb-4">
            Explore refinement templates tuned for common tasks.
          </p>
          <div>
            <a
              href="/templates"
              className="inline-flex items-center gap-2 rounded bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-500"
            >
              View Templates
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
