import { ImageResponse } from "next/og";
import { getProfileDashboardData } from "@/lib/data/profile-service";

export const alt = "DevPulse public GitHub profile analytics";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function ProfileOpenGraphImage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const data = await getProfileDashboardData(username, "30D", "en", false).catch(() => null);
  const displayName = data?.user.name || data?.user.login || username;
  const login = data?.user.login || username;
  return new ImageResponse(
    <div style={{ display: "flex", height: "100%", width: "100%", background: "#FFD84D", color: "#111", fontFamily: "Arial, sans-serif", border: "18px solid #111" }}>
      <div style={{ display: "flex", width: "72%", flexDirection: "column", justifyContent: "space-between", padding: 56, borderRight: "8px solid #111" }}>
        <div style={{ display: "flex", alignItems: "center", fontSize: 24, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase" }}>DevPulse · Public GitHub analytics</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 72, lineHeight: 0.95, fontWeight: 900, letterSpacing: "-0.05em" }}>{displayName}</div>
          <div style={{ display: "flex", marginTop: 16, fontSize: 32, fontWeight: 700, opacity: 0.55 }}>@{login}</div>
        </div>
      </div>
      <div style={{ display: "flex", width: "28%", flexDirection: "column", justifyContent: "space-between", padding: 42, background: "#3567FF", color: "white" }}>
        <CardMetric label={data?.contributionData.source === "events" ? "Recent public events" : "30D contributions"} value={data?.contributionData.totalContributions ?? "Unavailable"} />
        <CardMetric label="Focus score" value={data?.focus.score ?? "—"} />
        <CardMetric label="Top language" value={data?.languages[0]?.name ?? "—"} />
      </div>
    </div>,
    size,
  );
}

function CardMetric({ label, value }: { label: string; value: string | number }) {
  return <div style={{ display: "flex", flexDirection: "column" }}><span style={{ fontSize: 18, fontWeight: 700, opacity: 0.6 }}>{label}</span><span style={{ marginTop: 8, fontSize: 44, fontWeight: 900 }}>{value}</span></div>;
}
