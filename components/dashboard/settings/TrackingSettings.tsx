"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export function TrackingSettings() {
  const [trackingEnabled, setTrackingEnabled] = useState(true);
  const [collectIpAddress, setCollectIpAddress] = useState(true);
  const [respectDoNotTrack, setRespectDoNotTrack] = useState(false);
  const [anonymizeIp, setAnonymizeIp] = useState(false);

  return (
    <div className="space-y-6">
      <Card className="border border-stone-200 rounded-2xl bg-stone-0">
        <CardHeader>
          <CardTitle>Tracking Configuration</CardTitle>
          <CardDescription>
            Configure how Postmetric collects and processes visitor data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Tracking</Label>
              <p className="text-sm text-stone-500">
                Enable or disable data collection for all websites
              </p>
            </div>
            <Switch
              checked={trackingEnabled}
              onCheckedChange={setTrackingEnabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Collect IP Address</Label>
              <p className="text-sm text-stone-500">
                Collect visitor IP addresses for geolocation
              </p>
            </div>
            <Switch
              checked={collectIpAddress}
              onCheckedChange={setCollectIpAddress}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Anonymize IP Address</Label>
              <p className="text-sm text-stone-500">
                Anonymize IP addresses by removing the last octet
              </p>
            </div>
            <Switch checked={anonymizeIp} onCheckedChange={setAnonymizeIp} />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Respect Do Not Track</Label>
              <p className="text-sm text-stone-500">
                Honor browser Do Not Track preferences
              </p>
            </div>
            <Switch
              checked={respectDoNotTrack}
              onCheckedChange={setRespectDoNotTrack}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border border-stone-200 rounded-2xl bg-stone-0">
        <CardHeader>
          <CardTitle>Data Retention</CardTitle>
          <CardDescription>
            Configure how long to retain analytics data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Retention Period (days)</Label>
            <Input
              type="number"
              placeholder="365"
              defaultValue={365}
              min={30}
              max={2555}
            />
            <p className="text-sm text-stone-500">
              Data older than this period will be automatically deleted
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
