import { ImageResponse } from "next/og";
import { getShareCard } from "@/lib/data/share-service";
import { parseLocale } from "@/lib/utils/strings";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams;
  const card = await getShareCard(query.get("username") ?? "", query.get("kind") ?? "", query.get("id") ?? "", parseLocale(query.get("lang") ?? undefined));
  if (!card) return new Response("Not found", { status: 404 });
  return new ImageResponse(<div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: "100%", height: "100%", padding: 64, border: "18px solid #111", background: "#FFD84D", color: "#111", fontFamily: "sans-serif" }}>
    <div style={{ display: "flex", fontSize: 26, fontWeight: 700 }}>DevPulse · {card.subtitle}</div>
    <div style={{ display: "flex", fontSize: 64, fontWeight: 900 }}>{card.title}</div>
    <div style={{ display: "flex", fontSize: 86, fontWeight: 900, color: "#3567FF" }}>{card.value}</div>
    <div style={{ display: "flex", fontSize: 26 }}>{card.detail}</div>
  </div>, { width: 1200, height: 630 });
}
