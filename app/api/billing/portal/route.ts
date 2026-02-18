import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/get-session";
import connectDB from "@/db";
import User from "@/db/models/User";
import { createBillingPortalSession } from "@/lib/billing/stripe";

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const stripeCustomerId = (user as any).subscription?.stripeCustomerId;
    if (!stripeCustomerId) {
      return NextResponse.json(
        { error: "No billing account found. Subscribe to a plan first." },
        { status: 400 }
      );
    }

    const { url } = await createBillingPortalSession({
      userId,
      stripeCustomerId,
    });

    return NextResponse.json({ url });
  } catch (error: unknown) {
    console.error("[billing/portal]", error);
    const message =
      error instanceof Error ? error.message : "Portal session failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
