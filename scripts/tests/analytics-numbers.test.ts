/**
 * Offline regression test for server-side analytics numbers (DST buckets,
 * period ranges, unique-visitor counting, goal conversion, overview response
 * contract).
 *
 * Needs a THROWAWAY local MongoDB (the script drops its database):
 *   mongod --dbpath <tmp> --port 27997 --fork --logpath <tmp>/m.log
 *   MONGODB_URI=mongodb://127.0.0.1:27997/pm_analytics_test \
 *     npx tsx --tsconfig tsconfig.json scripts/tests/analytics-numbers.test.ts
 */
import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import mongoose, { Types } from "mongoose";

const uri = process.env.MONGODB_URI || "";
if (!/127\.0\.0\.1|localhost/.test(uri)) {
  console.error("Refusing to run: MONGODB_URI must point at a local mongod.");
  process.exit(1);
}

const NY_SITE = new Types.ObjectId();
const IN_SITE = new Types.ObjectId();
process.env.DEMO_WEBSITE_ID = NY_SITE.toHexString();
// The analytics route imports firebase-admin at module load; give it a
// syntactically valid dummy service account (never used: demo website).
if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  process.env.FIREBASE_SERVICE_ACCOUNT_KEY = JSON.stringify({
    project_id: "offline-test",
    client_email: "test@offline-test.iam.gserviceaccount.com",
    private_key: privateKey.export({ type: "pkcs8", format: "pem" }),
  });
}

let failures = 0;
async function check(name: string, fn: () => unknown | Promise<unknown>) {
  try {
    await fn();
    console.log(`  ok  ${name}`);
  } catch (e) {
    failures++;
    console.log(`  FAIL ${name}\n       ${(e as Error).message}`);
  }
}

const z = (iso: string) => new Date(iso);

async function main() {
  const { default: connectDB } = await import("@/db");
  await connectDB();
  await mongoose.connection.db!.dropDatabase();
  const db = mongoose.connection.db!;

  const dt = await import("@/lib/date-time-conversion");
  const pl = await import("@/utils/analytics/pipelines");
  const { getVisitorsOverTime } =
    await import("@/utils/analytics/aggregations/getVisitorsOverTime.aggregation");
  const { getChannelBreakdownWithReferrers } =
    await import("@/utils/analytics/aggregations/getChannelBreakdownWithReferrers.aggregation");
  const { getSourceBreakdown } =
    await import("@/utils/analytics/aggregations/getSourceBreakdown.aggregation");
  const { getPagesBreakdown } =
    await import("@/utils/analytics/aggregations/getPagesBreakdown.aggregation");
  const { getHostnamesBreakdown } =
    await import("@/utils/analytics/aggregations/getHostnamesBreakdown.aggregation");
  const { getLocationBreakdown } =
    await import("@/utils/analytics/aggregations/getLocationBreakdown.aggregation");
  const { getSystemBreakdown } =
    await import("@/utils/analytics/aggregations/getSystemBreakdown.aggregation");
  const { getReferrersBreakdown } =
    await import("@/utils/analytics/aggregations/getReferrersBreakdown.aggregation");
  const { getCampaignBreakdown } =
    await import("@/utils/analytics/aggregations/getCampaignBreakdown.aggregation");
  const { getEntryPagesBreakdown } =
    await import("@/utils/analytics/aggregations/getEntryPagesBreakdown.aggregation");
  const { getExitLinksBreakdown } =
    await import("@/utils/analytics/aggregations/getExitLinksBreakdown.aggregation");
  const { getVisitorsNow } =
    await import("@/utils/analytics/aggregations/getVisitorsNow.aggregation");

  // ------------------------------------------------------------------ seed
  await db.collection("websites").insertMany([
    {
      _id: NY_SITE,
      userId: new Types.ObjectId(),
      domain: "ny.example",
      name: "NY",
      trackingCode: "ny",
      settings: { timezone: "America/New_York", currency: "USD" },
    },
    {
      _id: IN_SITE,
      userId: new Types.ObjectId(),
      domain: "in.example",
      name: "IN",
      trackingCode: "in",
      settings: { timezone: "Asia/Kolkata", currency: "INR" },
    },
  ]);

  const sessions: any[] = [];
  const pageviews: any[] = [];
  const goals: any[] = [];
  let sid = 0;
  const addSession = (
    websiteId: Types.ObjectId,
    visitorId: string,
    times: Date[],
    extra: Record<string, unknown> = {},
    paths: string[] = [],
  ) => {
    const sessionId = `s${++sid}`;
    sessions.push({
      websiteId,
      sessionId,
      visitorId,
      firstVisitAt: times[0],
      lastSeenAt: times[times.length - 1],
      device: "desktop",
      browser: "Chrome",
      os: "macOS",
      country: "US",
      pageViews: times.length,
      duration: 0,
      bounce: times.length === 1,
      ...extra,
    });
    times.forEach((t, i) =>
      pageviews.push({
        websiteId,
        sessionId,
        visitorId,
        path: paths[i] ?? (i === 0 ? "/landing?ref=abc" : `/p${i}`),
        hostname: (extra.hostname as string) ?? "ny.example",
        device: "desktop",
        browser: "Chrome",
        os: "macOS",
        country: (extra.country as string) ?? "US",
        timestamp: t,
      }),
    );
    return sessionId;
  };

  // NY, fall-back DST (2025-11-02 02:00 EDT -> 01:00 EST).
  addSession(NY_SITE, "v1", [z("2025-11-02T03:30:00Z")]); // 11-01 23:30 EDT
  addSession(NY_SITE, "v2", [z("2025-11-02T04:30:00Z")]); // 11-02 00:30 EDT
  addSession(NY_SITE, "v5", [z("2025-11-02T05:30:00Z")]); // 01:30 EDT
  addSession(NY_SITE, "v6", [z("2025-11-02T06:30:00Z")]); // 01:30 EST
  addSession(NY_SITE, "v3", [z("2025-11-03T04:30:00Z")]); // 11-02 23:30 EST
  addSession(NY_SITE, "v4", [z("2025-11-03T05:30:00Z")]); // 11-03 00:30 EST
  // Legacy exit-link row stored as a PageView: must not count.
  pageviews.push({
    websiteId: NY_SITE,
    sessionId: "legacy",
    visitorId: "ghost",
    path: "/x",
    hostname: "ny.example",
    device: "desktop",
    browser: "Chrome",
    os: "macOS",
    country: "US",
    exitUrl: "https://out.example/a",
    timestamp: z("2025-11-02T12:00:00Z"),
  });

  // NY, channels window: 2025-10-10 (local) — c1 has 3 Google sessions + 1
  // Bing session, c2 one Google session, c3 one Google + one Twitter.
  const T = (h: number) => z(`2025-10-10T${String(h).padStart(2, "0")}:00:00Z`);
  const g = { referrer: "https://www.google.com/" };
  const c1a = addSession(NY_SITE, "c1", [T(13), T(13), T(13)], g, [
    "/landing?ref=abc",
    "/pricing",
    "/signup",
  ]);
  addSession(NY_SITE, "c1", [T(14)], g);
  addSession(NY_SITE, "c1", [T(15)], g);
  addSession(NY_SITE, "c1", [T(16)], { referrer: "https://www.bing.com/" });
  addSession(NY_SITE, "c2", [T(17)], g);
  addSession(NY_SITE, "c3", [T(18)], g);
  addSession(NY_SITE, "c3", [T(19)], { referrer: "https://twitter.com/x" });
  goals.push(
    {
      websiteId: NY_SITE,
      goalId: new Types.ObjectId(),
      sessionId: c1a,
      visitorId: "c1",
      path: "/signup",
      timestamp: T(13),
    },
    {
      websiteId: NY_SITE,
      goalId: new Types.ObjectId(),
      sessionId: c1a,
      visitorId: "c1",
      path: "/signup",
      timestamp: T(13),
    },
  );
  // Same sessionId on ANOTHER website must never be joined.
  sessions.push({
    ...sessions.find((s) => s.sessionId === c1a),
    _id: undefined,
    websiteId: IN_SITE,
    country: "IN",
    browser: "Firefox",
  });
  delete sessions[sessions.length - 1]._id;

  // City name collision across countries (Paris FR vs Paris US).
  const P = z("2025-09-15T15:00:00Z");
  const sFR = addSession(NY_SITE, "fr1", [P], {
    country: "FR",
    city: "Paris",
  });
  addSession(NY_SITE, "us1", [P], { country: "US", city: "Paris" });
  goals.push({
    websiteId: NY_SITE,
    goalId: new Types.ObjectId(),
    sessionId: sFR,
    visitorId: "fr1",
    path: "/landing",
    timestamp: P,
  });

  // Kolkata (+05:30, no DST).
  addSession(IN_SITE, "k1", [z("2026-01-10T18:20:00Z")], {
    hostname: "in.example",
  }); // 01-10 23:50 IST
  addSession(IN_SITE, "k2", [z("2026-01-10T18:40:00Z")], {
    hostname: "in.example",
  }); // 01-11 00:10 IST

  await db.collection("sessions").insertMany(sessions);
  await db.collection("pageviews").insertMany(pageviews);
  await db.collection("goalevents").insertMany(goals);
  await db.collection("exitclicks").insertOne({
    websiteId: NY_SITE,
    sessionId: "s1",
    visitorId: "v1",
    path: "/",
    exitUrl: "https://github.com/foo",
    exitLinkText: "GitHub",
    timestamp: z("2025-11-02T12:00:00Z"),
  });

  const NY = NY_SITE.toHexString();
  const IN = IN_SITE.toHexString();
  const NYTZ = "America/New_York";
  const INTZ = "Asia/Kolkata";

  // --------------------------------------------------------- range tests
  console.log("ranges");
  const ymd = (d: Date, tz: string) => dt.formatYMD(dt.localYMD(d, tz));
  const nowNY = z("2025-11-05T15:00:00Z"); // 10:00 EST
  await check("last 7 days = 7 local days (crosses DST)", () => {
    const r = dt.resolvePeriodRange("last 7 days", NYTZ, { now: nowNY });
    assert.equal(ymd(r.startDate, NYTZ), "2025-10-30");
    assert.equal(ymd(r.endDate, NYTZ), "2025-11-05");
    assert.equal(
      pl.getBucketKeys(r.startDate, r.endDate, "daily", NYTZ).length,
      7,
    );
    assert.equal(r.startDate.toISOString(), "2025-10-30T04:00:00.000Z");
  });
  await check("last 30 days = 30 local days", () => {
    const r = dt.resolvePeriodRange("Last 30 days", NYTZ, { now: nowNY });
    assert.equal(
      pl.getBucketKeys(r.startDate, r.endDate, "daily", NYTZ).length,
      30,
    );
  });
  await check("offset -1 shifts last 7 days back 7 days", () => {
    const r = dt.resolvePeriodRange("last 7 days", NYTZ, {
      now: nowNY,
      offset: -1,
    });
    assert.equal(ymd(r.startDate, NYTZ), "2025-10-23");
    assert.equal(ymd(r.endDate, NYTZ), "2025-10-29");
  });
  await check("today previous = yesterday up to same elapsed time", () => {
    const r = dt.resolvePeriodRange("today", NYTZ, { now: nowNY });
    assert.equal(r.startDate.toISOString(), "2025-11-05T05:00:00.000Z");
    assert.equal(r.previousStartDate.toISOString(), "2025-11-04T05:00:00.000Z");
    assert.equal(r.previousEndDate.toISOString(), "2025-11-04T15:00:00.000Z");
  });
  await check("month to date uses website tz (not server clock)", () => {
    // 2025-11-01T02:00Z is still Oct 31 in New York.
    const r = dt.resolvePeriodRange("month to date", NYTZ, {
      now: z("2025-11-01T02:00:00Z"),
    });
    assert.equal(ymd(r.startDate, NYTZ), "2025-10-01");
    assert.equal(r.startDate.toISOString(), "2025-10-01T04:00:00.000Z");
  });
  await check("year to date in Kolkata", () => {
    const r = dt.resolvePeriodRange("Year to date", INTZ, {
      now: z("2025-12-31T20:00:00Z"), // 2026-01-01 01:30 IST
    });
    assert.equal(r.startDate.toISOString(), "2025-12-31T18:30:00.000Z");
  });
  await check("last 12 months = 12 local months", () => {
    const r = dt.resolvePeriodRange("last 12 months", NYTZ, { now: nowNY });
    assert.equal(ymd(r.startDate, NYTZ), "2024-12-01");
    assert.equal(
      pl.getBucketKeys(r.startDate, r.endDate, "monthly", NYTZ).length,
      12,
    );
  });
  await check("month to date offset -1 = whole previous month", () => {
    const r = dt.resolvePeriodRange("month to date", NYTZ, {
      now: nowNY,
      offset: -1,
    });
    assert.equal(ymd(r.startDate, NYTZ), "2025-10-01");
    assert.equal(ymd(r.endDate, NYTZ), "2025-10-31");
  });
  await check("custom range inclusive local dates", () => {
    const r = dt.resolvePeriodRange("custom:2025-11-01:2025-11-03", NYTZ);
    assert.equal(r.startDate.toISOString(), "2025-11-01T04:00:00.000Z");
    assert.equal(r.endDate.toISOString(), "2025-11-04T04:59:59.999Z");
    assert.equal(r.previousStartDate.toISOString(), "2025-10-29T04:00:00.000Z");
  });

  // -------------------------------------------------------- bucket tests
  console.log("buckets");
  await check("NY daily buckets across fall-back DST", async () => {
    const r = dt.resolvePeriodRange("custom:2025-10-31:2025-11-04", NYTZ);
    const keys = pl.getBucketKeys(r.startDate, r.endDate, "daily", NYTZ);
    assert.deepEqual(
      keys.map((k) => k.key),
      ["2025-10-31", "2025-11-01", "2025-11-02", "2025-11-03", "2025-11-04"],
    );
    const v = await getVisitorsOverTime(
      NY,
      r.startDate,
      r.endDate,
      "daily",
      NYTZ,
    );
    const m = Object.fromEntries(v.map((x) => [x.key, x.visitors]));
    assert.deepEqual(m, {
      "2025-11-01": 1,
      "2025-11-02": 4, // v2, v5, v6, v3 (legacy exit row excluded)
      "2025-11-03": 1,
    });
    for (const x of v) assert.ok(keys.some((k) => k.key === x.key));
  });
  await check(
    "NY hourly: 25h day -> 24 keys, repeated 01h merged",
    async () => {
      const r = dt.resolvePeriodRange("custom:2025-11-02:2025-11-02", NYTZ);
      const keys = pl.getBucketKeys(r.startDate, r.endDate, "hourly", NYTZ);
      assert.equal(keys.length, 24);
      const v = await getVisitorsOverTime(
        NY,
        r.startDate,
        r.endDate,
        "hourly",
        NYTZ,
      );
      const m = Object.fromEntries(v.map((x) => [x.key, x.visitors]));
      assert.equal(m["2025-11-02 01"], 2);
      assert.equal(m["2025-11-02 00"], 1);
      assert.equal(m["2025-11-02 23"], 1);
    },
  );
  await check("NY hourly spring-forward day has 23 keys", () => {
    const r = dt.resolvePeriodRange("custom:2026-03-08:2026-03-08", NYTZ);
    const keys = pl.getBucketKeys(r.startDate, r.endDate, "hourly", NYTZ);
    assert.equal(keys.length, 23);
    assert.ok(!keys.some((k) => k.key === "2026-03-08 02"));
  });
  await check("NY weekly buckets start on local Mondays", async () => {
    const r = dt.resolvePeriodRange("custom:2025-10-31:2025-11-04", NYTZ);
    const keys = pl.getBucketKeys(r.startDate, r.endDate, "weekly", NYTZ);
    assert.deepEqual(
      keys.map((k) => k.key),
      ["2025-10-27", "2025-11-03"],
    );
    const v = await getVisitorsOverTime(
      NY,
      r.startDate,
      r.endDate,
      "weekly",
      NYTZ,
    );
    const m = Object.fromEntries(v.map((x) => [x.key, x.visitors]));
    assert.deepEqual(m, { "2025-10-27": 5, "2025-11-03": 1 });
  });
  await check("Kolkata daily buckets (+05:30)", async () => {
    const r = dt.resolvePeriodRange("custom:2026-01-10:2026-01-11", INTZ);
    const v = await getVisitorsOverTime(
      IN,
      r.startDate,
      r.endDate,
      "daily",
      INTZ,
    );
    const m = Object.fromEntries(v.map((x) => [x.key, x.visitors]));
    assert.deepEqual(m, { "2026-01-10": 1, "2026-01-11": 1 });
    const h = await getVisitorsOverTime(
      IN,
      r.startDate,
      r.endDate,
      "hourly",
      INTZ,
    );
    assert.deepEqual(
      h.map((x) => x.key),
      ["2026-01-10 23", "2026-01-11 00"],
    );
    assert.equal(h[1].date.toISOString(), "2026-01-10T18:30:00.000Z");
  });

  // ------------------------------------------------------ breakdown tests
  console.log("breakdowns");
  const chStart = z("2025-10-10T04:00:00Z");
  const chEnd = z("2025-10-11T03:59:59.999Z");
  await check("channel tab counts unique visitors", async () => {
    const ch: any[] = await getChannelBreakdownWithReferrers(
      NY,
      chStart,
      chEnd,
    );
    const organic = ch.find((c) => c.name === "Organic search");
    assert.ok(organic, JSON.stringify(ch.map((c) => c.name)));
    assert.equal(organic.uv, 3); // c1, c2, c3 (not 6 sessions / 4 referrer-rows)
    const google = organic.referrers.find((r: any) => r.name === "Google");
    assert.equal(google?.uv, 3);
    assert.equal(organic.goalCount, 2);
    assert.ok(Math.abs(organic.goalConversionRate - 1 / 3) < 1e-9);
    for (const c of ch) {
      assert.ok(c.goalConversionRate <= 1);
      for (const r of c.referrers) assert.ok(r.goalConversionRate <= 1);
    }
  });
  await check("source-channel counts unique visitors", async () => {
    const ch: any[] = (await getSourceBreakdown(
      NY,
      chStart,
      chEnd,
      "channel",
    )) as any[];
    const organic = ch.find((c) => c.name === "Organic search");
    assert.ok(organic, JSON.stringify(ch.map((c) => c.name)));
    assert.equal(organic.uv, 3);
    assert.ok(organic.goalConversionRate <= 1);
    assert.ok(Math.abs(organic.goalConversionRate - 1 / 3) < 1e-9);
  });
  await check("pages/hostnames count each goal once", async () => {
    const pages: any[] = await getPagesBreakdown(NY, chStart, chEnd);
    const total = pages.reduce((s, p) => s + p.goalCount, 0);
    assert.equal(total, 2);
    assert.equal(pages.find((p) => p.name === "/signup")?.goalCount, 2);
    const hosts: any[] = await getHostnamesBreakdown(NY, chStart, chEnd);
    assert.equal(
      hosts.reduce((s, h) => s + h.goalCount, 0),
      2,
    );
    for (const p of pages) assert.ok(p.goalConversionRate <= 1);
  });
  await check("system/location goals do not join other websites", async () => {
    const sys: any[] = await getSystemBreakdown(NY, chStart, chEnd, "browser");
    assert.equal(
      sys.find((s) => s.name === "Firefox"),
      undefined,
    );
    assert.equal(sys.find((s) => s.name === "Chrome")?.goalCount, 2);
    assert.equal(sys.find((s) => s.name === "Chrome")?.uv, 3);
  });
  await check("city goals grouped with country", async () => {
    const pS = z("2025-09-15T04:00:00Z");
    const pE = z("2025-09-16T03:59:59Z");
    const cities: any[] = await getLocationBreakdown(NY, pS, pE, "city");
    const fr = cities.find((c) => c.name === "Paris" && c.countryCode === "FR");
    const us = cities.find((c) => c.name === "Paris" && c.countryCode === "US");
    assert.equal(fr?.goalCount, 1);
    assert.equal(us?.goalCount, 0);
  });
  await check("breakdowns count sessions active in window", async () => {
    // Session started before the window but active inside it counts.
    const late = addSession(NY_SITE, "late", [
      z("2025-10-09T23:00:00Z"),
      z("2025-10-10T05:00:00Z"),
    ]);
    await db
      .collection("sessions")
      .insertOne(sessions.find((s) => s.sessionId === late));
    await db
      .collection("pageviews")
      .insertMany(pageviews.filter((p) => p.sessionId === late));
    const sys: any[] = await getSystemBreakdown(NY, chStart, chEnd, "browser");
    assert.equal(sys.find((s) => s.name === "Chrome")?.uv, 4);
    const refs: any[] = await getReferrersBreakdown(NY, chStart, chEnd);
    assert.ok(refs.length > 0);
    const camp: any[] = await getCampaignBreakdown(NY, chStart, chEnd);
    assert.ok(camp.some((c) => c.param_ref === "abc"));
    const entry: any[] = await getEntryPagesBreakdown(NY, chStart, chEnd);
    assert.equal(
      entry.reduce((s, e) => s + e.goalCount, 0),
      2,
    );
  });
  await check("exit links read from ExitClick", async () => {
    const ex: any[] = await getExitLinksBreakdown(
      NY,
      z("2025-11-01T00:00:00Z"),
      z("2025-11-04T00:00:00Z"),
    );
    assert.deepEqual(
      ex.map((e) => [e.name, e.uv, e.exits]),
      [["github.com", 1, 1]],
    );
  });
  await check(
    "visitors now: recent pageview OR recent lastSeenAt",
    async () => {
      const now = Date.now();
      await db.collection("sessions").insertMany([
        {
          websiteId: NY_SITE,
          sessionId: "rt1",
          visitorId: "rt-a",
          firstVisitAt: new Date(now - 3600e3),
          lastSeenAt: new Date(now - 60e3),
          device: "desktop",
          browser: "Chrome",
          os: "macOS",
          country: "US",
        },
        {
          websiteId: NY_SITE,
          sessionId: "rt2",
          visitorId: "rt-b",
          firstVisitAt: new Date(now - 3600e3),
          lastSeenAt: new Date(now - 3600e3), // stale lastSeenAt
          device: "desktop",
          browser: "Chrome",
          os: "macOS",
          country: "US",
        },
      ]);
      await db.collection("pageviews").insertOne({
        websiteId: NY_SITE,
        sessionId: "rt2",
        visitorId: "rt-b",
        path: "/",
        hostname: "ny.example",
        device: "desktop",
        browser: "Chrome",
        os: "macOS",
        country: "US",
        timestamp: new Date(now - 30e3),
      });
      assert.equal(await getVisitorsNow(NY), 2);
    },
  );

  // --------------------------------------------------- overview contract
  console.log("overview route");
  await check("analytics route response contract", async () => {
    const { GET } =
      await import("@/app/api/websites/[websiteId]/analytics/route");
    const { NextRequest } = await import("next/server");
    const call = async (qs: string) => {
      const res = await GET(
        new NextRequest(`http://localhost/api/websites/${NY}/analytics?${qs}`),
        { params: Promise.resolve({ websiteId: NY }) },
      );
      assert.equal(res.status, 200);
      return res.json();
    };
    const body = await call(
      "period=custom:2025-10-10:2025-10-10&granularity=hourly",
    );
    assert.deepEqual(Object.keys(body.percentageChange).sort(), [
      "bounceRate",
      "conversionRate",
      "pageViews",
      "revenue",
      "revenuePerVisitor",
      "sessionDuration",
      "sessions",
      "visitors",
    ]);
    for (const v of Object.values(body.percentageChange))
      assert.ok(v === null || typeof v === "number");
    // Previous day (Oct 9 local) has 1 visitor ("late" at 19:00 EDT).
    assert.equal(body.percentageChange.visitors, 300);
    // Empty previous period -> null, never "100".
    const paris = await call("period=custom:2025-09-15:2025-09-15");
    assert.equal(paris.totalVisitors, 2);
    assert.equal(paris.percentageChange.visitors, null);
    assert.equal(paris.percentageChange.revenue, null);
    assert.equal(body.totalVisitors, 4); // c1, c2, c3, late
    assert.ok(body.goalConversionRate <= 100);
    assert.ok(Math.abs(body.goalConversionRate - 25) < 1e-9);
    assert.equal(body.processedData.length, 24);
    assert.equal(body.range.timezone, NYTZ);
    assert.equal(body.range.start, "2025-10-10T04:00:00.000Z");
    const daily = await call(
      "period=custom:2025-10-31:2025-11-04&granularity=daily",
    );
    assert.deepEqual(
      daily.processedData.map((p: any) => p.visitors),
      [0, 1, 4, 1, 0],
    );
    const shifted = await call(
      "period=custom:2025-11-05:2025-11-09&granularity=daily&offset=-1",
    );
    assert.equal(shifted.range.start, "2025-10-31T04:00:00.000Z");
    assert.equal(shifted.totalVisitors, 6);
  });

  await mongoose.connection.db!.dropDatabase();
  await mongoose.disconnect();
  if (failures) {
    console.log(`\n${failures} check(s) failed`);
    process.exit(1);
  }
  console.log("\nall checks passed");
}

main().catch(async (e) => {
  console.error(e);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
