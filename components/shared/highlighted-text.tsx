import { expandSearchTerms } from "@/lib/search/item-search";

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function HighlightedText({
  text,
  query,
  className,
}: {
  text: string;
  query?: string;
  className?: string;
}) {
  const terms = expandSearchTerms(query ?? "")
    .filter((term) => term.trim().length > 0)
    .sort((a, b) => b.length - a.length);

  if (!text || terms.length === 0) {
    return <span className={className}>{text}</span>;
  }

  const pattern = new RegExp(`(${terms.map(escapeRegExp).join("|")})`, "gi");
  const parts = text.split(pattern);

  return (
    <span className={className}>
      {parts.map((part, index) =>
        terms.some((term) => term.toLowerCase() === part.toLowerCase()) ? (
          <mark
            key={`${part}-${index}`}
            className="rounded bg-[rgba(214,154,97,0.18)] px-0.5 text-inherit"
          >
            {part}
          </mark>
        ) : (
          <span key={`${part}-${index}`}>{part}</span>
        ),
      )}
    </span>
  );
}
