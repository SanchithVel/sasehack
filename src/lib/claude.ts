import Anthropic from "@anthropic-ai/sdk";

export const MODEL = "claude-opus-5-5";

// Server-side fallback: if Claude declines a request, the API automatically
// re-runs it on a fallback model inside the same call.
export const FALLBACK = {
  betas: ["server-side-fallback-2026-07-01"] as Anthropic.Beta.AnthropicBeta[],
  fallbacks: "default" as const,
};

let client: Anthropic | undefined;

/** Lazily created so a missing key only fails the request that needs it. */
export function claude() {
  return (client ??= new Anthropic());
}

/** Concatenate the text blocks of a response. */
export function textOf(content: Anthropic.Beta.BetaContentBlock[]) {
  return content
    .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}

export function errorMessage(err: unknown) {
  const noCredentials = err instanceof Error && err.message.includes("authentication method");
  // These reach the owner, so keep them plain and free of vendor names.
  if (err instanceof Anthropic.AuthenticationError || noCredentials) return "Smart features aren't set up yet (missing API key in .env.local).";
  if (err instanceof Anthropic.RateLimitError) return "Too many requests right now. Try again in a moment.";
  if (err instanceof Anthropic.APIError) return `Something went wrong (error ${err.status}). Try again.`;
  if (err instanceof Error) return err.message;
  return "Unknown error";
}
