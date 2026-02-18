import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/get-session";
import connectDB from "@/db";
import User from "@/db/models/User";

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ canManageBilling: false }, { status: 200 });
    }

    await connectDB();

    const user = await User.findById(userId).select("subscription").lean();
    const stripeCustomerId = (user?.subscription as any)?.stripeCustomerId;

    return NextResponse.json({
      canManageBilling: !!stripeCustomerId,
    });
  } catch {
    return NextResponse.json({ canManageBilling: false }, { status: 200 });
  }
}
