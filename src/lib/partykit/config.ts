const DEFAULT_HOST = "127.0.0.1:1999";

function rawHost(): string {
  return process.env.NEXT_PUBLIC_PARTYKIT_HOST || DEFAULT_HOST;
}

/**
 * Returns the bare host (no scheme, no trailing slash) suitable for
 * PartySocket's `host` option. Accepts env values with or without a
 * leading `http(s)://`.
 */
export function getPartyHost(): string {
  return rawHost()
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/+$/, "");
}

/**
 * Base HTTP(S) URL for the PartyKit host (no trailing slash).
 * Preserves the scheme from the env var if provided, otherwise
 * defaults to http for local hosts and https for everything else.
 */
export function getPartyHttpBase(): string {
  const raw = rawHost().trim().replace(/\/+$/, "");
  const match = /^(https?):\/\/(.+)$/i.exec(raw);
  if (match) return `${match[1].toLowerCase()}://${match[2]}`;

  const isLocal =
    raw.startsWith("127.0.0.1") ||
    raw.startsWith("localhost") ||
    raw.startsWith("0.0.0.0");
  return `${isLocal ? "http" : "https"}://${raw}`;
}
