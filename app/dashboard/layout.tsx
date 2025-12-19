import Image from "next/image";
import Link from "next/link";
import { UserMenu } from "@/components/dashboard/UserMenu";
import { getSession } from "@/lib/get-session";
import connectDB from "@/db";
import User from "@/db/models/User";
import { calculateTrialDaysRemaining } from "@/utils/trial";

// Force dynamic rendering since we use cookies for session
export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let daysRemaining: number | null = null;

  try {
    const session = await getSession();
    if (session?.user?.id) {
      await connectDB();
      const user = await User.findById(session.user.id);
      daysRemaining = calculateTrialDaysRemaining(
        user?.subscription?.trialEndsAt
      );
    }
  } catch (error) {
    console.error("Error calculating trial days:", error);
  }

  const displayDays =
    daysRemaining !== null
      ? daysRemaining
      : parseInt(process.env.TRIAL_PERIOD_DAYS || "14", 10);

  return (
    <div className="antialiased font-sans min-h-screen bg-stone-50">
      <div className="w-full flex flex-col items-center">
        <Link
          href="/dashboard/billing"
          className="block w-full bg-stone-100 px-4 py-2.5 text-center text-sm text-stone-700 hover:bg-stone-200 transition-colors border-b border-stone-200"
        >
          You have{" "}
          <span className="font-medium text-stone-800">
            {displayDays} {displayDays === 1 ? "day" : "days"}
          </span>{" "}
          left in your free trial
          <span>
            {" "}
            —{" "}
            <span className="text-stone-800 font-medium underline">
              Pick a plan for $0
            </span>{" "}
            to keep analytics running without interruption
          </span>
        </Link>

        <header className="w-full bg-stone-50/80 border-b border-stone-200/50 sticky top-0 z-50 backdrop-blur-lg">
          <nav
            className="mx-auto flex max-w-4xl items-center justify-between px-4 pb-4 pt-4 md:px-8"
            aria-label="Global"
          >
            <Link
              href="/dashboard"
              className="flex items-center gap-2"
              title="PostMetric dashboard"
            >
              <Image
                alt="PostMetric logo"
                src="/icon.svg"
                width={24}
                height={24}
                className="w-6 h-6 rounded-md"
                unoptimized
              />
              <span className="font-bold text-stone-800 text-lg tracking-tight">
                PostMetric
              </span>
            </Link>
            <UserMenu />
          </nav>
        </header>
        {children}
      </div>
    </div>
  );
}
