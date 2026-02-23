"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/firebase/auth-context";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchNotificationSettingsForWebsite,
  updateNotificationSettingsForWebsite,
} from "@/store/slices/websitesSlice";

function ReportsSettingsShimmer() {
  return (
    <div>
      <div className="mb-2 space-y-2">
        <Skeleton className="h-4 w-full max-w-md" />
        <Skeleton className="h-4 w-48" />
      </div>
      <Card className="custom-card overflow-hidden">
        <div className="flex items-center justify-between gap-2 p-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-6 w-11 rounded-full shrink-0" />
        </div>
        <div className="flex items-center justify-between gap-2 border-t border-base-content/5 p-4">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-6 w-11 rounded-full shrink-0" />
        </div>
      </Card>
    </div>
  );
}

interface ReportsSettingsProps {
  website: {
    _id: string;
    domain: string;
    name: string;
  } | null;
  websiteId: string;
  onUpdate: () => void;
}

export function ReportsSettings({
  website,
  websiteId,
  onUpdate,
}: ReportsSettingsProps) {
  const { user: firebaseUser } = useAuth();
  const dispatch = useAppDispatch();
  const { notifications, notificationsLoading } = useAppSelector(
    (state) => state.websites,
  );
  const [weeklySummary, setWeeklySummary] = useState(false);
  const [trafficSpike, setTrafficSpike] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (websiteId) {
      dispatch(fetchNotificationSettingsForWebsite(websiteId));
    }
  }, [websiteId, dispatch]);

  useEffect(() => {
    if (notifications) {
      setWeeklySummary(notifications.weeklySummary || false);
      setTrafficSpike(notifications.trafficSpike || false);
    }
  }, [notifications]);

  const handleToggle = async (
    type: "weeklySummary" | "trafficSpike",
    value: boolean,
  ) => {
    setUpdating(true);
    try {
      const newWeeklySummary = type === "weeklySummary" ? value : weeklySummary;
      const newTrafficSpike = type === "trafficSpike" ? value : trafficSpike;

      await dispatch(
        updateNotificationSettingsForWebsite({
          websiteId,
          weeklySummary: newWeeklySummary,
          trafficSpike: newTrafficSpike,
        }),
      ).unwrap();

      if (type === "weeklySummary") {
        setWeeklySummary(value);
      } else {
        setTrafficSpike(value);
      }
      onUpdate();
    } catch (error: any) {
      alert(error || "Failed to update notification settings");
    } finally {
      setUpdating(false);
    }
  };

  if (notificationsLoading) {
    return <ReportsSettingsShimmer />;
  }

  return (
    <div>
      <p className="text-base-secondary mb-2 text-sm">
        We'll email you at{" "}
        <span className="font-medium text-base-content">
          {firebaseUser?.email || "your email"}
        </span>{" "}
        for the following events:
      </p>
      <Card className="custom-card">
        <div className="flex items-center justify-between gap-2 p-4">
          <h2 className="font-medium">Weekly summary</h2>
          <Switch
            checked={weeklySummary}
            onCheckedChange={(checked) =>
              handleToggle("weeklySummary", checked)
            }
            disabled={updating}
          />
        </div>
        <div className="flex items-center justify-between gap-2 border-t border-base-content/5 p-4">
          <h2 className="font-medium">Traffic spike</h2>
          <Switch
            checked={trafficSpike}
            onCheckedChange={(checked) => handleToggle("trafficSpike", checked)}
            disabled={updating}
          />
        </div>
      </Card>
    </div>
  );
}
