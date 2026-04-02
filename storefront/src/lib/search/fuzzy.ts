/**
 * Fuzzy string matching utilities for search enhancement.
 * Uses Damerau-Levenshtein distance for typo-tolerant matching.
 * Works with any Unicode text (English, Hebrew, Arabic, etc.)
 */

/** Damerau-Levenshtein distance — handles insertions, deletions, substitutions, and transpositions */
export function editDistance(a: string, b: string): number {
  const la = a.length;
  const lb = b.length;
  if (la === 0) return lb;
  if (lb === 0) return la;

  const d: number[][] = Array.from({ length: la + 1 }, () => Array(lb + 1).fill(0));
  for (let i = 0; i <= la; i++) d[i][0] = i;
  for (let j = 0; j <= lb; j++) d[0][j] = j;

  for (let i = 1; i <= la; i++) {
    for (let j = 1; j <= lb; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1,       // deletion
        d[i][j - 1] + 1,       // insertion
        d[i - 1][j - 1] + cost, // substitution
      );
      // Transposition (e.g., "teh" → "the")
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + cost);
      }
    }
  }
  return d[la][lb];
}

/** Normalized similarity score (0 = no match, 1 = exact) */
export function similarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - editDistance(a, b) / maxLen;
}

/** Find the best fuzzy match from a list of candidates */
export function findBestMatch(
  query: string,
  candidates: string[],
  minSimilarity = 0.6,
): { match: string; score: number } | null {
  const q = query.toLowerCase();
  let best: { match: string; score: number } | null = null;

  for (const candidate of candidates) {
    const c = candidate.toLowerCase();
    // Exact match — return immediately
    if (q === c) return { match: candidate, score: 1 };
    // Prefix match (high priority — user is typing the start of a word)
    if (c.startsWith(q) && q.length >= 3) {
      const score = 0.9;
      if (!best || score > best.score) {
        best = { match: candidate, score };
      }
      continue;
    }
    // Contains match
    if (c.includes(q) && q.length >= 3) {
      const score = 0.85 * (q.length / c.length);
      if (score >= minSimilarity && (!best || score > best.score)) {
        best = { match: candidate, score };
      }
      continue;
    }
    // Fuzzy edit-distance match
    const score = similarity(q, c);
    if (score >= minSimilarity && (!best || score > best.score)) {
      best = { match: candidate, score };
    }
  }
  return best;
}

/** Find all matches above threshold, sorted by score descending */
export function findAllMatches(
  query: string,
  candidates: string[],
  minSimilarity = 0.6,
  maxResults = 5,
): Array<{ match: string; score: number }> {
  const q = query.toLowerCase();
  const results: Array<{ match: string; score: number }> = [];

  for (const candidate of candidates) {
    const c = candidate.toLowerCase();
    let score = 0;
    if (q === c) {
      score = 1;
    } else if (c.startsWith(q) && q.length >= 2) {
      score = 0.9;
    } else if (c.includes(q) && q.length >= 3) {
      score = 0.85 * (q.length / c.length);
    } else {
      score = similarity(q, c);
    }
    if (score >= minSimilarity) {
      results.push({ match: candidate, score });
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, maxResults);
}

/** Simple stemmer — handles common English plural/verb forms */
export function simpleStem(word: string): string {
  const w = word.toLowerCase();
  if (w.length <= 3) return w;
  // -ies → -y (puppies → puppy)
  if (w.endsWith("ies") && w.length > 4) return w.slice(0, -3) + "y";
  // -ches, -shes, -ses, -xes, -zes → remove -es
  if (/(?:ch|sh|s|x|z)es$/.test(w)) return w.slice(0, -2);
  // -s → remove (beds → bed, collars → collar)
  if (w.endsWith("s") && !w.endsWith("ss") && w.length > 3) return w.slice(0, -1);
  // -ing → remove (running → runn, feeding → feed)
  if (w.endsWith("ing") && w.length > 5) return w.slice(0, -3);
  // -ed → remove (elevated → elevat)
  if (w.endsWith("ed") && w.length > 4) return w.slice(0, -2);
  return w;
}

/** Tokenize a query into meaningful words (works with any Unicode script) */
export function tokenize(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[\s\-_,&+/|]+/)
    .map((w) => w.replace(/[^\p{L}\p{N}]/gu, ""))
    .filter((w) => w.length >= 2);
}
