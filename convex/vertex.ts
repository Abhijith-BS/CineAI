"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { GoogleAuth } from "google-auth-library";
import { VertexAI } from "@google-cloud/vertexai";

export const groundedTitles = action({
  args: {
    message: v.string(),
    topN: v.optional(v.number()),
    region: v.optional(v.string()),
    language: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const topN = Math.min(Math.max(args.topN ?? 10, 4), 12);

    // Ensure ADC can find credentials (we already set GOOGLE_APPLICATION_CREDENTIALS)
    const projectId = process.env.GCP_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT;

    const vertex = new VertexAI({ project: projectId, location: "us-central1" });
    const model = vertex.getGenerativeModel({ model: "gemini-1.5-pro-002" });

    const sys = `You are a movie expert for Indian and global cinema. Return ${topN} movies most relevant to the user's intent with 1-line reasons. Prefer films over TV, avoid documentaries unless asked. If the user implies Indian cinema, prioritize Indian titles. Output strict JSON lines: {"title":"...","year":2022,"reason":"..."}.`;

    const tools = [{ googleSearch: {} } as any];

    const res = await model.generateContent({
      contents: [
        { role: "user", parts: [{ text: sys }] },
        { role: "user", parts: [{ text: args.message }] },
      ],
      tools,
      generationConfig: { temperature: 0.6 },
    } as any);

    const text = (res as any).response?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("\n") || (res as any).response?.text?.() || "";
    const lines = String(text).split(/\n+/).map((l) => l.trim()).filter(Boolean);

    const out: Array<{ title: string; year: number | null; reason: string }> = [];
    for (const line of lines) {
      try {
        const obj = JSON.parse(line);
        if (obj?.title) {
          out.push({ title: String(obj.title), year: obj.year ? Number(obj.year) : null, reason: String(obj.reason || "Relevant match.") });
        }
      } catch {
        // ignore non-JSON lines
      }
    }

    return out.slice(0, topN);
  }
});
