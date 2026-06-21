import "server-only";
import { fetchText, cached } from "./http";
import type { NewsItem } from "./types";

const POSITIVE = /\b(surge|jump|rise|gain|profit|beat|record|growth|upgrade|bull|rally|expand|win|approval|strong|high)\b/i;
const NEGATIVE = /\b(fall|drop|loss|decline|miss|cut|downgrade|bear|slump|weak|probe|fraud|fine|lawsuit|layoff|crash|plunge|warn)\b/i;

function classifyImpact(title: string): NewsItem["impact"] {
  const pos = POSITIVE.test(title);
  const neg = NEGATIVE.test(title);
  if (pos && !neg) return "positive";
  if (neg && !pos) return "negative";
  return "neutral";
}

/** Free news via Google News RSS, parsed with lightweight regex. */
export async function getNews(query: string, limit = 12): Promise<NewsItem[]> {
  try {
    return await cached(`news:${query}`, 15 * 60_000, async () => {
      const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query + " India")}&hl=en-IN&gl=IN&ceid=IN:en`;
      const xml = await fetchText(url, { timeoutMs: 6000 });
      const items: NewsItem[] = [];
      const itemRe = /<item>([\s\S]*?)<\/item>/g;
      let m: RegExpExecArray | null;
      while ((m = itemRe.exec(xml)) && items.length < limit) {
        const block = m[1];
        const title = decode(pick(block, "title"));
        const link = pick(block, "link");
        const pubDate = pick(block, "pubDate");
        const sourceMatch = /<source[^>]*>([\s\S]*?)<\/source>/.exec(block);
        if (!title) continue;
        items.push({
          title: title.replace(/ - [^-]+$/, ""),
          link,
          source: sourceMatch ? decode(sourceMatch[1]) : "Google News",
          publishedAt: pubDate || new Date().toISOString(),
          impact: classifyImpact(title),
        });
      }
      return items;
    });
  } catch {
    return demoNews(query);
  }
}

function pick(block: string, tag: string): string {
  const re = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`);
  const m = re.exec(block);
  return m ? m[1].trim() : "";
}

function decode(s: string): string {
  return s
    .replace(/<!\[CDATA\[|\]\]>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .trim();
}

function demoNews(query: string): NewsItem[] {
  const now = Date.now();
  return [
    { title: `${query}: Q1 results beat street estimates on margin expansion`, link: "#", source: "Demo Wire", publishedAt: new Date(now - 3 * 3600e3).toISOString(), impact: "positive" },
    { title: `Analysts maintain neutral stance on ${query} ahead of guidance`, link: "#", source: "Demo Wire", publishedAt: new Date(now - 26 * 3600e3).toISOString(), impact: "neutral" },
    { title: `${query} faces near-term demand softness, brokerage flags risk`, link: "#", source: "Demo Wire", publishedAt: new Date(now - 50 * 3600e3).toISOString(), impact: "negative" },
  ];
}
