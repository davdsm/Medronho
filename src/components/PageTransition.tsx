import { forwardRef, useImperativeHandle, useRef } from "react";

const ease = "cubic-bezier(0.22, 1, 0.36, 1)";

const phrases = [
  "a amadurecer…",
  "na caixa…",
  "pela Beira Baixa…",
  "ao toque…",
  "de outono…",
  "a vermelhar…",
];

const berries = [
  { left: "5%", size: 28, ripe: 1, drift: -4, delay: 40 },
  { left: "14%", size: 20, ripe: 0.7, drift: 3, delay: 160 },
  { left: "23%", size: 34, ripe: 1, drift: -6, delay: 0 },
  { left: "34%", size: 18, ripe: 0.55, drift: 5, delay: 220 },
  { left: "44%", size: 30, ripe: 0.9, drift: -2, delay: 90 },
  { left: "55%", size: 24, ripe: 0.75, drift: 4, delay: 180 },
  { left: "64%", size: 36, ripe: 1, drift: -5, delay: 50 },
  { left: "74%", size: 19, ripe: 0.6, drift: 6, delay: 260 },
  { left: "83%", size: 27, ripe: 0.95, drift: -3, delay: 120 },
  { left: "92%", size: 22, ripe: 0.8, drift: 2, delay: 200 },
  { left: "9%", size: 16, ripe: 0.5, drift: 7, delay: 300 },
  { left: "48%", size: 21, ripe: 0.85, drift: -4, delay: 140 },
];

function BerryMark({ ripe, id }: { ripe: number; id: string }) {
  const flesh = ripe > 0.8 ? "#c43a22" : ripe > 0.65 ? "#b83220" : "#c9842e";
  const tip = ripe > 0.7 ? "#e85a3a" : "#d4a04a";
  const deep = "#2c0908";

  return (
    <svg viewBox="0 0 64 72" className="page-transition__berry-svg" aria-hidden="true">
      <defs>
        <radialGradient id={`pt-b-${id}`} cx="36%" cy="30%" r="70%">
          <stop offset="0%" stopColor={tip} />
          <stop offset="48%" stopColor={flesh} />
          <stop offset="100%" stopColor={deep} />
        </radialGradient>
      </defs>
      <path
        d="M32 8c3-8 12-10 16-3"
        stroke="#5c4030"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <ellipse cx="44" cy="10" rx="8" ry="3.5" fill="#8ea34a" transform="rotate(24 44 10)" />
      <ellipse cx="26" cy="12" rx="6" ry="2.8" fill="#6d8a32" transform="rotate(-18 26 12)" />
      <path
        d="M32 18c-14 2-24 15-22 29 2 15 15 24 27 22 13-2 22-15 20-28C55 27 44 16 32 18Z"
        fill={`url(#pt-b-${id})`}
      />
      <g fill="#f3c63a" opacity={0.28 + ripe * 0.12}>
        <circle cx="24" cy="34" r="1.6" />
        <circle cx="34" cy="30" r="1.3" />
        <circle cx="42" cy="38" r="1.5" />
        <circle cx="28" cy="44" r="1.2" />
        <circle cx="38" cy="48" r="1.4" />
      </g>
    </svg>
  );
}

export type PageTransitionHandle = {
  run: (navigate: () => void) => void;
};

export const PageTransition = forwardRef<PageTransitionHandle>(function PageTransition(_, ref) {
  const root = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLDivElement>(null);
  const curtain = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLDivElement>(null);
  const phrase = useRef<HTMLSpanElement>(null);
  const berryRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const busy = useRef(false);

  useImperativeHandle(ref, () => ({
    run(navigate) {
      const shell = root.current;
      const soft = field.current;
      const hard = curtain.current;
      const copy = label.current;
      const word = phrase.current;
      const fruits = berryRefs.current;
      if (!shell || !soft || !hard || !copy || !word || busy.current) {
        navigate();
        return;
      }

      busy.current = true;
      window.__medronhoPTActive = true;
      document.documentElement.dataset.ptHold = "true";
      delete document.documentElement.dataset.pageIn;
      shell.style.pointerEvents = "auto";
      word.textContent = phrases[Math.floor(Math.random() * phrases.length)];

      soft.animate([{ transform: "translateY(108%)" }, { transform: "translateY(0%)" }], {
        duration: 720,
        easing: ease,
        fill: "forwards",
      });
      hard.animate([{ transform: "translateY(108%)" }, { transform: "translateY(0%)" }], {
        duration: 720,
        delay: 90,
        easing: ease,
        fill: "forwards",
      });
      copy.animate(
        [
          { opacity: 0, transform: "translateY(22px) scale(0.96)" },
          { opacity: 1, transform: "translateY(0) scale(1)" },
        ],
        { duration: 520, delay: 480, easing: ease, fill: "forwards" },
      );

      fruits.forEach((berry, index) => {
        if (!berry) return;
        const drift = berries[index]?.drift ?? 0;
        berry.style.setProperty("--pt-drift", `${drift}vw`);
        berry.style.animation = "none";
        void berry.offsetWidth;
        berry.style.animation = `berry-fall ${1900 + (index % 6) * 320}ms cubic-bezier(0.22, 0.61, 0.36, 1) ${140 + index * 95}ms both`;
      });

      window.setTimeout(navigate, 780);

      window.setTimeout(() => {
        hard.animate([{ transform: "translateY(0%)" }, { transform: "translateY(-108%)" }], {
          duration: 700,
          easing: ease,
          fill: "forwards",
        });
        soft.animate([{ transform: "translateY(0%)" }, { transform: "translateY(-108%)" }], {
          duration: 700,
          delay: 80,
          easing: ease,
          fill: "forwards",
        });
        copy.animate(
          [
            { opacity: 1, transform: "translateY(0) scale(1)" },
            { opacity: 0, transform: "translateY(-18px) scale(0.98)" },
          ],
          { duration: 320, easing: "ease", fill: "forwards" },
        );
        window.setTimeout(() => {
          window.__medronhoPTActive = false;
          window.dispatchEvent(new CustomEvent("medronho:pt-reveal"));
        }, 780);
      }, 1480);

      window.setTimeout(() => {
        shell.style.pointerEvents = "none";
        fruits.forEach((berry) => {
          if (!berry) return;
          const fade = berry.animate(
            [{ opacity: getComputedStyle(berry).opacity }, { opacity: 0 }],
            { duration: 650, easing: "ease", fill: "forwards" },
          );
          fade.onfinish = () => {
            berry.style.animation = "none";
          };
        });
        busy.current = false;
      }, 2350);
    },
  }));

  return (
    <div
      ref={root}
      className="page-transition"
      aria-hidden="true"
      style={{ pointerEvents: "none" }}
    >
      <div
        ref={field}
        className="page-transition__field"
        style={{ transform: "translateY(108%)" }}
      />
      <div
        ref={curtain}
        className="page-transition__curtain"
        style={{ transform: "translateY(108%)" }}
      />
      <div ref={label} className="page-transition__label" style={{ opacity: 0 }}>
        <span className="page-transition__mark" aria-hidden="true">
          <BerryMark ripe={1} id="mark" />
        </span>
        <span ref={phrase}>a amadurecer…</span>
      </div>
      {berries.map((berry, index) => (
        <span
          key={index}
          ref={(node) => {
            berryRefs.current[index] = node;
          }}
          className="page-transition__berry"
          style={{
            left: berry.left,
            width: berry.size,
            height: berry.size * 1.15,
            ["--pt-drift" as string]: `${berry.drift}vw`,
          }}
        >
          <BerryMark ripe={berry.ripe} id={`f${index}`} />
        </span>
      ))}
    </div>
  );
});

declare global {
  interface Window {
    __medronhoPTActive?: boolean;
  }
}
