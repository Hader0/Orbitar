import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { generateApiKey, revokeApiKey } from "../actions";
import { redirect } from "next/navigation";
import { CheckoutButtons } from "./CheckoutButtons";
import { DashboardNotice } from "./DashboardNotice";

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
      </div>
    </div>
  );
}
