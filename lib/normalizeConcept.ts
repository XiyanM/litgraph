import { prisma } from "@/lib/prisma";
import { getEmbedding, cosineSimilarity } from "@/lib/embeddings";

const SIMILARITY_THRESHOLD = 0.58;

function normalizeLabel(label: string): string {
  return label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, "");
}

function toTitleCase(s: string): string {
  const minorWords = new Set([
    "and",
    "or",
    "the",
    "a",
    "an",
    "of",
    "in",
    "vs",
    "vs.",
  ]);
  return s
    .split(" ")
    .map((word, i) =>
      i > 0 && minorWords.has(word.toLowerCase())
        ? word.toLowerCase()
        : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(" ");
}

export async function resolveConcept(
  label: string
): Promise<{ id: string; label: string }> {
  const existingConcepts = await prisma.concept.findMany({
    select: { id: true, label: true, embedding: true },
  });

  // Layer 1: free, cheap — catches case/punctuation/whitespace variants only
  // (e.g. "Totalitarianism" vs "totalitarianism"). Won't catch true synonyms.
  const normalized = normalizeLabel(label);
  const exactMatch = existingConcepts.find(
    (c) => normalizeLabel(c.label) === normalized
  );
  if (exactMatch) return { id: exactMatch.id, label: exactMatch.label };

  // Layer 2: embedding similarity — the core layer. Catches genuine synonyms
  // like "Alienation" vs "Isolation and Alienation" that share no exact substring.
  const embedding = await getEmbedding(label);

  let best: { id: string; label: string; similarity: number } | null = null;
  for (const c of existingConcepts) {
    if (!c.embedding || c.embedding.length === 0) continue;
    const similarity = cosineSimilarity(embedding, c.embedding);
    if (!best || similarity > best.similarity) {
      best = { id: c.id, label: c.label, similarity };
    }
  }

  if (best && best.similarity >= SIMILARITY_THRESHOLD) {
    // Prefer the shorter label as canonical — reads cleaner in the graph UI,
    // regardless of which book happened to introduce the concept first.
    if (label.length < best.label.length) {
      const canonical = toTitleCase(label);
      await prisma.concept.update({
        where: { id: best.id },
        data: { label: canonical },
      });
      return { id: best.id, label: canonical };
    }
    return { id: best.id, label: best.label };
  }

  // Layer 3 (LLM tie-break) intentionally skipped — per your own scope notes,
  // optional/skip for MVP.

  // No match at any layer — genuinely new concept. Store the embedding we
  // already computed so future comparisons don't recompute it.
  const created = await prisma.concept.create({
    data: { label: toTitleCase(label), embedding },
  });
  return { id: created.id, label: created.label };
}
