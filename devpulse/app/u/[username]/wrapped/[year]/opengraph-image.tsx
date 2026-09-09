import { ImageResponse } from "next/og";
import { getWrappedSummary } from "@/lib/data/wrapped-service";

export const alt = "DevPulse GitHub Wrapped";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function WrappedOpenGraphImage({ params }: { params: Promise<{ username: string; year: string }> }) {
  const { username, year: rawYear } = await params;
  const year = Number(rawYear);
  const data = await getWrappedSummary(username, year, false).catch(() => null);
  const login = data?.user.login || username;
  const observed = data?.contributionData.source === "graphql" || Boolean(data?.contributionData.days.length);
  return new ImageResponse(
    <div style={{ display: "flex", height: "100%", width: "100%", background: "#171717", color: "white", fontFamily: "Arial, sans-serif", border: "18px solid #111" }}>
      <div style={{ display: "flex", width: "68%", flexDirection: "column", justifyContent: "space-between", padding: 54, background: "#FFD84D", color: "#111", borderRight: "8px solid #111" }}>
        <div style={{ display: "flex", fontSize: 24, fontWeight: 900, letterSpacing: "0.14em", textTransform: "uppercase" }}>DevPulse · @{login}</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 92, lineHeight: 0.84, fontWeight: 900, letterSpacing: "-0.07em", textTransform: "uppercase" }}>GitHub<br />Wrapped</span>
          <span style={{ marginTop: 24, fontSize: 64, fontWeight: 900, color: "#3567FF" }}>{year}</span>
        </div>
      </div>
      <div style={{ display: "flex", width: "32%", flexDirection: "column", justifyContent: "space-between", padding: 44 }}>
        <WrappedMetric label={data?.contributionData.limited ? "Limited public events" : "Contributions"} value={observed ? data?.contributionData.totalContributions ?? "Unavailable" : "Unavailable"} />
        <WrappedMetric label="Active days" value={observed ? data?.activity.activeDays ?? "—" : "—"} />
        <WrappedMetric label="Top language" value={data?.languages[0]?.name ?? "—"} />
      </div>
    </div>,
    size,
  );
}

function WrappedMetric({ label, value }: { label: string; value: string | number }) {
  return <div style={{ display: "flex", flexDirection: "column" }}><span style={{ fontSize: 19, fontWeight: 700, opacity: 0.55 }}>{label}</span><span style={{ marginTop: 9, fontSize: 48, fontWeight: 900 }}>{value}</span></div>;
}
