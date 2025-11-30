import Session from "@/db/models/Session";
import { Types } from "mongoose";

/**
 * Link payment to visitor/session
 */
export async function linkPaymentToVisitor(
  payment: {
    metadata?: Record<string, any>;
    customerEmail?: string;
    timestamp: Date;
  },
  websiteId: string
): Promise<{ sessionId?: string; visitorId?: string } | null> {
  // Strategy 1: Try metadata first (most reliable)
  if (payment.metadata?.visitorId) {
    return {
      visitorId: payment.metadata.visitorId,
      sessionId: payment.metadata.sessionId,
    };
  }

  // Strategy 2: Try email matching (if user identification is enabled)
  if (payment.customerEmail) {
    // Find recent session with matching email
    // Note: This requires user identification to be enabled and stored
    // For now, we'll skip this as it requires additional user identification storage
  }

  // Strategy 3: Timestamp correlation (less reliable)
  // Find sessions within 1 hour before payment
  const oneHourBefore = new Date(payment.timestamp.getTime() - 60 * 60 * 1000);
  const oneHourAfter = new Date(payment.timestamp.getTime() + 60 * 60 * 1000);

  const recentSessions = await Session.find({
    websiteId: new Types.ObjectId(websiteId),
    lastSeenAt: {
      $gte: oneHourBefore,
      $lte: oneHourAfter,
    },
  })
    .sort({ lastSeenAt: -1 })
    .limit(1);

  if (recentSessions.length > 0) {
    return {
      sessionId: recentSessions[0].sessionId,
      visitorId: recentSessions[0].visitorId,
    };
  }

  return null;
}
