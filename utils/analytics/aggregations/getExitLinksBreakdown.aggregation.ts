import connectDB from "@/db";
import ExitClick from "@/db/models/ExitClick";
import { Types } from "mongoose";

export async function getExitLinksBreakdown(
  websiteId: string,
  startDate: Date,
  endDate: Date,
) {
  await connectDB();

  const websiteObjectId = new Types.ObjectId(websiteId);

  const exitLinksPipeline = [
    {
      $match: {
        websiteId: websiteObjectId,
        timestamp: { $gte: startDate, $lte: endDate },
        exitUrl: { $nin: [null, ""] },
      },
    },
    {
      $addFields: {
        exitDomain: {
          $let: {
            vars: {
              withoutProtocol: {
                $replaceAll: {
                  input: {
                    $replaceAll: {
                      input: "$exitUrl",
                      find: "https://",
                      replacement: "",
                    },
                  },
                  find: "http://",
                  replacement: "",
                },
              },
            },
            in: {
              $arrayElemAt: [{ $split: ["$$withoutProtocol", "/"] }, 0],
            },
          },
        },
      },
    },
    {
      $group: {
        _id: {
          exitDomain: "$exitDomain",
          visitorId: "$visitorId",
        },
        exits: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: "$_id.exitDomain",
        uniqueVisitors: { $sum: 1 },
        totalExits: { $sum: "$exits" },
      },
    },
  ];

  // Exit-link clicks live in their own collection (`exitclicks`); legacy
  // PageView rows with `exitUrl` are no longer read here.
  const exitLinksData = await ExitClick.aggregate(exitLinksPipeline);

  // Step 2: Format the result with favicon URLs
  const result = exitLinksData.map((item) => {
    const domain = item._id || "";
    // Generate favicon URL using DuckDuckGo's favicon service
    const faviconUrl = `https://icons.duckduckgo.com/ip3/${domain}.ico`;

    return {
      name: domain,
      uv: item.uniqueVisitors || 0,
      exits: item.totalExits || 0,
      image: faviconUrl,
    };
  });

  // Sort by unique visitors descending, then by exits descending
  result.sort((a, b) => {
    if (b.uv !== a.uv) {
      return b.uv - a.uv;
    }
    return b.exits - a.exits;
  });

  return result;
}
