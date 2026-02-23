import connectDB from "@/db";
import Website from "@/db/models/Website";
import PageView from "@/db/models/PageView";
import GoalEvent from "@/db/models/GoalEvent";
import mongoose from "mongoose";

function getCurrentMonthBounds(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
  );
  return { start, end };
}

export async function getMonthlyEventCount(userId: string): Promise<number> {
  await connectDB();

  const websites = await Website.find({ userId }).select("_id").lean();
  const websiteIds = websites.map((w) => w._id);

  if (websiteIds.length === 0) {
    return 0;
  }

  const { start, end } = getCurrentMonthBounds();
  const objectIds = websiteIds.map((id) =>
    typeof id === "string" ? new mongoose.Types.ObjectId(id) : id,
  );

  const match = {
    websiteId: { $in: objectIds },
    timestamp: { $gte: start, $lt: end },
  };

  const [pageViewCount, goalEventCount] = await Promise.all([
    PageView.countDocuments(match),
    GoalEvent.countDocuments(match),
  ]);

  return pageViewCount + goalEventCount;
}
