import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/get-session";
import connectDB from "@/db";
import User from "@/db/models/User";
import { createCheckoutSession } from "@/lib/billing/stripe";
import type { PlanId } from "@/lib/billing/plans";
import { VOLUME_KEYS, type VolumeKey } from "@/lib/billing/pricing-tiers";

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { planId, billingPeriod, volume } = body as {
      planId: PlanId;
      billingPeriod: "monthly" | "yearly";
      volume?: VolumeKey;
    };

    const validVolumes = VOLUME_KEYS;
    const volumeKey = (
      volume && validVolumes.includes(volume) ? volume : "10K"
    ) as VolumeKey;

    if (
      !planId ||
      !billingPeriod ||
      !["starter", "pro"].includes(planId) ||
      !["monthly", "yearly"].includes(billingPeriod)
    ) {
      return NextResponse.json(
        { error: "Invalid planId or billingPeriod" },
        { status: 400 },
      );
    }

    await connectDB();

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const stripeCustomerId =
      (user as any).subscription?.stripeCustomerId ?? null;

    const { url } = await createCheckoutSession({
      userId,
      userEmail: user.email,
      userName: user.name,
      planId,
      billingPeriod,
      volume: volumeKey,
      stripeCustomerId,
    });

    return NextResponse.json({ url });
  } catch (error: unknown) {
    console.error("[billing/checkout]", error);
    const message = error instanceof Error ? error.message : "Checkout failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
