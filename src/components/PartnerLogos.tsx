import { partners } from "../data";

const shapes = [
  "M32 2a30 30 0 1 0 0 60 30 30 0 0 0 0-60",
  "M8 8h48v48H8z",
  "M32 2 62 32 32 62 2 32z",
  "M32 4 58 19v26L32 60 6 45V19z",
  "M18 2h28a14 14 0 0 1 0 60H18A14 14 0 0 1 18 2",
];

function Mark({ name, index }: { name: string; index: number }) {
  const letters = name
    .split(" ")
    .filter((word) => word.length > 2)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  return (
    <svg viewBox="0 0 64 64" className="size-[4.5rem] md:size-24" aria-hidden="true">
      <path d={shapes[index % shapes.length]} fill="currentColor" />
      <text
        x="32"
        y="38"
        textAnchor="middle"
        fill="#f3c63a"
        fontFamily="Paytone One, sans-serif"
        fontSize="18"
      >
        {letters}
      </text>
    </svg>
  );
}

export function PartnerLogos() {
  return (
    <ul className="flex flex-wrap items-center justify-center gap-x-10 gap-y-8 md:gap-x-16">
      {partners.map((partner, index) => (
        <li key={partner.name} className="text-ink/35 transition-opacity duration-300 hover:text-ink/70">
          <span className="sr-only">{partner.name}</span>
          <Mark name={partner.name} index={index} />
        </li>
      ))}
    </ul>
  );
}
