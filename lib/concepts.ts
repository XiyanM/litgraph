interface ExtractedConcept {
  label: string;
  rationale: string;
  prominence: number;
}

interface ConceptExtractionInput {
  title: string;
  author: string;
  description: string | null;
  subjects: string[];
  wikipediaExcerpt: string | null;
}

const CONCEPT_SCHEMA = {
  type: "object",
  properties: {
    concepts: {
      type: "array",
      items: {
        type: "object",
        properties: {
          label: {
            type: "string",
            description:
              "A short concept or theme name, e.g. 'Totalitarianism' or 'Class mobility'.",
          },
          rationale: {
            type: "string",
            description:
              "One sentence explaining why this concept applies to THIS book specifically, grounded in its plot or themes — not a generic definition of the concept.",
          },
          prominence: {
            type: "integer",
            description:
              "How central this concept is to the book: 1 = minor/background, 5 = the book's central concern.",
          },
        },
        required: ["label", "rationale", "prominence"],
        additionalProperties: false,
      },
    },
  },
  required: ["concepts"],
  additionalProperties: false,
} as const;

export async function extractConcepts(
  book: ConceptExtractionInput
): Promise<ExtractedConcept[] | null> {
  const contextParts = [
    `Title: ${book.title}`,
    `Author: ${book.author}`,
    book.subjects.length ? `Categories: ${book.subjects.join(", ")}` : null,
    book.description ? `Description: ${book.description}` : null,
    book.wikipediaExcerpt
      ? `Wikipedia excerpt:\n${book.wikipediaExcerpt}`
      : null,
  ].filter(Boolean);

  const userPrompt = `${contextParts.join(
    "\n\n"
  )}\n\nExtract exactly 3 to 5 recurring concepts or themes from this book. Ground each rationale in specific plot points or ideas from the text above where possible, rather than generic literary-criticism language.`;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        // gpt-4o-mini: cheap, fast, confirmed-stable structured-outputs support.
        model: "gpt-4o-mini",
        temperature: 0.3,
        messages: [
          {
            role: "system",
            content:
              "You are a literary analyst extracting recurring concepts/themes from books for a concept-mapping tool. Respond only with the requested JSON.",
          },
          { role: "user", content: userPrompt },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "book_concepts",
            strict: true,
            schema: CONCEPT_SCHEMA,
          },
        },
      }),
    });

    if (!res.ok) {
      console.error("OpenAI API error:", res.status, await res.text());
      return null;
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      console.error(
        "OpenAI returned no content. Full response:",
        JSON.stringify(data)
      );
      return null;
    }

    const parsed = JSON.parse(content);
    console.log(`OpenAI returned ${parsed.concepts?.length ?? 0} concepts`);
    return parsed.concepts ?? null;
  } catch (err) {
    console.error("Concept extraction failed:", err);
    return null;
  }
}
