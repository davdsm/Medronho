/** Realistic medronho SVGs for the physics loader. */

export type FruitAsset = {
  html: string;
  ratio: string;
  scale: number;
};

type BerryOpts = {
  id: string;
  ripe: number;
  w?: number;
  h?: number;
  lean?: number;
};

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function hexMix(a: string, b: string, t: number) {
  const parse = (hex: string) => {
    const h = hex.replace("#", "");
    return [
      parseInt(h.slice(0, 2), 16),
      parseInt(h.slice(2, 4), 16),
      parseInt(h.slice(4, 6), 16),
    ] as const;
  };
  const [ar, ag, ab] = parse(a);
  const [br, bg, bb] = parse(b);
  const to = (n: number) => n.toString(16).padStart(2, "0");
  return `#${to(Math.round(lerp(ar, br, t)))}${to(Math.round(lerp(ag, bg, t)))}${to(Math.round(lerp(ab, bb, t)))}`;
}

/** Fibonacci-ish points on the visible front of the fruit. */
function papillaLayout(count: number, seed: number) {
  const pts: { x: number; y: number; z: number; r: number }[] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i += 1) {
    const t = (i + 0.5) / count;
    const y = 1 - t * 1.85;
    const radius = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = i * golden + seed;
    const x = Math.cos(theta) * radius;
    const z = Math.sin(theta) * radius;
    if (z < -0.15) continue;
    const facing = clamp((z + 0.2) / 1.2, 0.15, 1);
    pts.push({ x, y, z, r: facing });
  }
  return pts.sort((a, b) => a.z - b.z);
}

function berrySvg({ id, ripe, w = 240, h = 280, lean = 0 }: BerryOpts) {
  const cx = w * 0.5;
  const cy = h * 0.58;
  const rx = w * 0.38;
  const ry = h * 0.34;

  const tip = hexMix("#e8a03a", "#f06a42", ripe);
  const flesh = hexMix("#c9842e", "#b01e14", ripe);
  const valley = hexMix("#5a3010", "#2a0808", ripe);
  const sheen = hexMix("#f6d08a", "#ffb198", ripe);
  const papGold = hexMix("#d4a04a", "#e07058", ripe);

  const papillae = papillaLayout(52 + Math.round(ripe * 10), ripe * 12.7 + lean * 3)
    .map((p, index) => {
      const px = cx + p.x * rx * 0.92 + lean * 6;
      const py = cy + p.y * ry * 0.9;
      const size = lerp(3.4, 7.2, p.r) * lerp(0.88, 1.1, (Math.sin(index * 2.1 + ripe) + 1) * 0.5);
      const light = clamp(0.35 + p.r * 0.55 + p.y * -0.08, 0.25, 0.95);
      const fill = hexMix(valley, tip, light * ripe + (1 - ripe) * 0.45);
      const rim = hexMix(valley, flesh, 0.35 + light * 0.4);
      const gloss =
        p.r > 0.45
          ? `<ellipse cx="${(px - size * 0.18).toFixed(1)}" cy="${(py - size * 0.22).toFixed(1)}" rx="${(size * 0.28).toFixed(1)}" ry="${(size * 0.2).toFixed(1)}" fill="${sheen}" opacity="${(0.2 + p.r * 0.3).toFixed(2)}"/>`
          : "";
      return `<ellipse cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" rx="${(size * 0.92).toFixed(1)}" ry="${(size * 0.78).toFixed(1)}" fill="${fill}" stroke="${rim}" stroke-width="0.55" opacity="${(0.75 + p.r * 0.25).toFixed(2)}"/>${gloss}`;
    })
    .join("");

  const stemX = cx + lean * 4;
  const leafA = ripe > 0.55 ? "#7f9440" : "#9aaa46";
  const leafB = ripe > 0.55 ? "#5f732e" : "#6d8a32";

  return `
<svg viewBox="0 0 ${w} ${h}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="${id}-body" cx="34%" cy="28%" r="72%">
      <stop offset="0%" stop-color="${tip}"/>
      <stop offset="38%" stop-color="${flesh}"/>
      <stop offset="78%" stop-color="${hexMix(flesh, valley, 0.55)}"/>
      <stop offset="100%" stop-color="${valley}"/>
    </radialGradient>
    <radialGradient id="${id}-gloss" cx="30%" cy="24%" r="55%">
      <stop offset="0%" stop-color="#fff6ea" stop-opacity="0.42"/>
      <stop offset="45%" stop-color="#fff6ea" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="#fff6ea" stop-opacity="0"/>
    </radialGradient>
    <clipPath id="${id}-clip">
      <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"/>
    </clipPath>
  </defs>

  <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#${id}-body)"/>

  <g clip-path="url(#${id}-clip)">
    <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#${id}-body)"/>
    ${papillae}
    <ellipse cx="${(cx - rx * 0.28).toFixed(1)}" cy="${(cy - ry * 0.32).toFixed(1)}" rx="${(rx * 0.42).toFixed(1)}" ry="${(ry * 0.28).toFixed(1)}" fill="url(#${id}-gloss)"/>
    <ellipse cx="${cx}" cy="${(cy + ry * 0.55).toFixed(1)}" rx="${(rx * 0.78).toFixed(1)}" ry="${(ry * 0.28).toFixed(1)}" fill="${valley}" opacity="0.22"/>
  </g>

  <!-- calyx / stem -->
  <path d="M${stemX} ${cy - ry * 0.92}c2-18 14-28 26-18" stroke="#5a3d2c" stroke-width="5.5" stroke-linecap="round" fill="none"/>
  <g transform="translate(${stemX} ${cy - ry * 0.88})">
    <ellipse cx="18" cy="-2" rx="20" ry="8" fill="${leafA}" transform="rotate(28)"/>
    <ellipse cx="-14" cy="0" rx="16" ry="7" fill="${leafB}" transform="rotate(-24)"/>
    <ellipse cx="4" cy="-10" rx="12" ry="5.5" fill="${leafA}" transform="rotate(8)" opacity="0.92"/>
    <ellipse cx="-2" cy="4" rx="10" ry="5" fill="${leafB}" transform="rotate(-6)" opacity="0.9"/>
    <circle cx="0" cy="2" r="7" fill="#6a7f30"/>
    <circle cx="-1" cy="1" r="3" fill="#9aaa46" opacity="0.55"/>
  </g>

  <!-- dusty tip accents -->
  <g fill="${papGold}" opacity="${(0.14 + ripe * 0.1).toFixed(2)}" clip-path="url(#${id}-clip)">
    <circle cx="${(cx - 18).toFixed(1)}" cy="${(cy - 24).toFixed(1)}" r="2.2"/>
    <circle cx="${(cx + 22).toFixed(1)}" cy="${(cy - 8).toFixed(1)}" r="1.8"/>
    <circle cx="${(cx + 6).toFixed(1)}" cy="${(cy + 30).toFixed(1)}" r="2"/>
  </g>
</svg>`.trim();
}

function clusterSvg(id: string) {
  const a = berrySvg({ id: `${id}a`, ripe: 0.92, w: 200, h: 230, lean: -4 });
  const b = berrySvg({ id: `${id}b`, ripe: 0.62, w: 160, h: 190, lean: 6 });
  // Compose two berries into one canvas without nested svg wrappers conflicting.
  const inner = (svg: string, ox: number, oy: number, s: number) => {
    const body = svg.replace(/<\/?svg[^>]*>/g, "");
    return `<g transform="translate(${ox} ${oy}) scale(${s})">${body}</g>`;
  };
  return `
<svg viewBox="0 0 300 300" fill="none" xmlns="http://www.w3.org/2000/svg">
  ${inner(a, 10, 40, 0.95)}
  ${inner(b, 118, 18, 0.82)}
</svg>`.trim();
}

function pack(html: string, w: number, h: number, scale: number): FruitAsset {
  return {
    html,
    ratio: `${w} / ${h}`,
    scale,
  };
}

export const fruits: FruitAsset[] = [
  pack(berrySvg({ id: "m1", ripe: 0.95, lean: -2 }), 240, 280, 1.08),
  pack(berrySvg({ id: "m2", ripe: 0.72, w: 220, h: 300, lean: 3 }), 220, 300, 0.94),
  pack(berrySvg({ id: "m3", ripe: 0.88, w: 250, h: 250, lean: 0 }), 250, 250, 1.02),
  pack(berrySvg({ id: "m4", ripe: 0.55, lean: -5 }), 240, 280, 0.9),
  pack(clusterSvg("m5"), 300, 300, 1.12),
  pack(berrySvg({ id: "m6", ripe: 0.8, w: 250, h: 250, lean: 4 }), 250, 250, 0.86),
  pack(berrySvg({ id: "m7", ripe: 0.98, w: 210, h: 300, lean: -1 }), 210, 300, 0.8),
  pack(berrySvg({ id: "m8", ripe: 0.68, lean: 2 }), 240, 280, 0.98),
];
