import { promises as fs } from "fs";
import path from "path";

let cached: { pains: string; jtbd: string } | null = null;

export async function getFeedbackPrompts(): Promise<{ pains: string; jtbd: string }> {
  if (cached) return cached;
  const filePath = path.join(process.cwd(), "FEEDBACK_PROMPTS.md");
  const fallbackPains =
    'Ты аналитик. По сырым цитатам сегмента выдели 3–7 болей/потребностей. Ответь только JSON: { "pains": [ "строка1", ... ] }.';
  const fallbackJtbd =
    'Ты JTBD-исследователь. По сегменту и цитатам верни один структурированный отзыв. Ответь только JSON с полями: job, situation, motivation, desiredOutcome, frictions, quote, confidence, basedOn (массив коротких ссылок на цитаты).';
  try {
    const content = await fs.readFile(filePath, "utf8");
    const painsMatch = content.match(/## Pains[\s\S]*?(?=\n## |$)/i);
    const jtbdMatch = content.match(/## JTBD[\s\S]*?(?=\n## |$)/i);
    cached = {
      pains: painsMatch ? painsMatch[0].replace(/^## Pains\s*/i, "").trim() : fallbackPains,
      jtbd: jtbdMatch ? jtbdMatch[0].replace(/^## JTBD\s*/i, "").trim() : fallbackJtbd,
    };
    return cached;
  } catch {
    cached = { pains: fallbackPains, jtbd: fallbackJtbd };
    return cached;
  }
}
