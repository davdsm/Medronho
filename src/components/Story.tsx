import { useLayoutEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "../gsap";
import { scene } from "../scene";
import { useReduced } from "../useReduced";
import { BerryCanvas } from "./Berry";
import { ParallaxMedia } from "./Parallax";
import { Pill } from "./Pill";
import { useList, useSite, useText } from "../content";
import { FadeUp, SplitText, useArrive } from "./Reveal";
import { withSpecies } from "./Species";

type Feature = {
  eyebrow: string;
  title: string;
  copy: string;
  image: string;
  alt: string;
  inset?: string;
  insetAlt?: string;
  flip?: boolean;
  /** Where the 3D berry docks relative to the photo. */
  dock?: "left" | "right" | "bottom-right";
};

/** Partes fixas de cada bloco (fotografias, posição da baga 3D); os textos vêm do backoffice. */
const featureLayout: Array<Omit<Feature, "eyebrow" | "title" | "copy">> = [
  {
    image: "/photos/branch.jpg",
    alt: "Ramo de medronheiro com flor e fruto no mesmo ramo.",
    dock: "right",
  },
  {
    image: "/photos/hillside.jpg",
    alt: "Encosta da Beira Baixa no outono, com medronheiros a vermelhar.",
    flip: true,
    dock: "right",
  },
  {
    image: "/photos/harvest.jpg",
    alt: "Mãos a escolher medronhos maduros pelo toque.",
    inset: "/photos/basket.jpg",
    insetAlt: "Cesto com medronhos acabados de apanhar.",
    dock: "bottom-right",
  },
];

const rest = {
  x: 0,
  y: 0.06,
  scale: 0.56,
  ry: 0.2,
};

/** Fallback park when the hero word box is not measurable yet. */
const restMobileFallback = {
  x: 0,
  y: 0.95,
  scale: 0.32,
  ry: 0.2,
};

const CAMERA_Z = 6.6;
const CAMERA_FOV = 30;
const CAMERA_Y = 0.05;

function isPhone() {
  return window.innerWidth < 900;
}

/** Park the berry above the "medronho" word — never on top of the letters. */
function mobileHeroPark() {
  const word =
    document.querySelector<HTMLElement>("#hero h1") ||
    document.querySelector<HTMLElement>(".hero-word");
  if (!word) return restMobileFallback;

  const r = word.getBoundingClientRect();
  if (r.width < 8 || r.height < 8) return restMobileFallback;

  const scale = 0.32;
  // Scene fruit radius ~1; cluster also hangs a bit below its origin.
  const visibleH =
    2 * Math.tan((CAMERA_FOV * Math.PI) / 180 / 2) * CAMERA_Z;
  const berryRadiusPx = (scale * window.innerHeight) / visibleH;
  const gap = Math.max(14, window.innerHeight * 0.018);
  const cx = r.left + r.width * 0.5;
  // Sit fully above the word box (clearance includes lower satellite fruit).
  const cy = r.top - berryRadiusPx * 1.45 - gap;
  const point = clientToScene(cx, Math.max(8, cy));

  return {
    x: point.x,
    y: point.y,
    scale,
    ry: 0.2,
  };
}

function heroRest() {
  return isPhone() ? mobileHeroPark() : rest;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function smoothstep(t: number) {
  const x = gsap.utils.clamp(0, 1, t);
  return x * x * (3 - 2 * x);
}

/** Map a viewport point to the berry's Three.js plane (z = 0). */
function clientToScene(clientX: number, clientY: number) {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const aspect = w / h;
  const vFov = (CAMERA_FOV * Math.PI) / 180;
  const visibleH = 2 * Math.tan(vFov / 2) * CAMERA_Z;
  const visibleW = visibleH * aspect;
  const nx = (clientX / w) * 2 - 1;
  const ny = -((clientY / h) * 2 - 1);
  return {
    x: nx * (visibleW / 2),
    y: ny * (visibleH / 2) + CAMERA_Y,
  };
}

function dockPoint(el: HTMLElement, side: "left" | "right" | "center" | "bottom-right") {
  const r = el.getBoundingClientRect();
  const insetX = Math.min(r.width, r.height) * 0.1;
  const insetY = Math.min(r.width, r.height) * 0.12;
  if (side === "bottom-right") {
    return clientToScene(r.right - insetX, r.bottom - insetY);
  }
  const x =
    side === "left"
      ? r.left + insetX
      : side === "right"
        ? r.right - insetX
        : r.left + r.width * 0.5;
  const y = r.top + r.height * 0.42;
  return clientToScene(x, y);
}

/** Keep the berry hugged to the image of whichever feature is in view. */
function strollBerry(progress = 0) {
  const passeio = document.getElementById("passeio");
  const docks = Array.from(document.querySelectorAll<HTMLElement>("[data-berry-dock]"));
  const phone = isPhone();
  const vh = window.innerHeight;
  const base = heroRest();

  if (!passeio || !docks.length) {
    scene.x = base.x;
    scene.y = base.y;
    scene.scale = base.scale;
    scene.ry = base.ry + progress * Math.PI * 0.4;
    scene.opacity = 1;
    return;
  }

  // Mobile: smaller berry; leave early, drift slowly upward and exit at the top.
  // Scroll back to the hero reverses the same path.
  if (phone) {
    const hero = document.getElementById("hero");
    const heroTop = hero?.getBoundingClientRect().top ?? 0;
    const leave = smoothstep((-heroTop - vh * 0.02) / (vh * 0.38));
    const visibleH = 2 * Math.tan((CAMERA_FOV * Math.PI) / 180 / 2) * CAMERA_Z;
    const exitY = visibleH * 0.58 + 1.55;

    scene.x = base.x;
    scene.y = lerp(base.y, exitY, leave);
    scene.scale = lerp(base.scale, base.scale * 0.82, leave);
    scene.ry = base.ry + leave * 0.45;
    scene.opacity = leave > 0.88 ? 1 - (leave - 0.88) / 0.12 : 1;
    return;
  }

  const passeioTop = passeio.getBoundingClientRect().top;
  // Long blend out of the hero so the berry drifts, not jumps.
  const leave = smoothstep((vh * 1.05 - passeioTop) / (vh * 0.95));

  let total = 0;
  let dockX = 0;
  let dockY = 0;
  let dockS = 0;

  docks.forEach((el) => {
    const attr = el.dataset.berryDock || "left";
    const r = el.getBoundingClientRect();
    const midY =
      attr === "bottom-right" ? r.top + r.height * 0.72 : r.top + r.height * 0.42;
    const visible = Math.min(r.bottom, vh) - Math.max(r.top, 0);
    const visibility = gsap.utils.clamp(0, 1, visible / Math.max(1, Math.min(r.height, vh * 0.85)));
    const proximity = 1 - gsap.utils.clamp(0, 1, Math.abs(midY - vh * 0.48) / (vh * 0.9));
    const weight = Math.pow(Math.max(0.0001, visibility * 0.35 + proximity * 0.65), 1.25);
    const side = phone
      ? attr === "bottom-right"
        ? "bottom-right"
        : "center"
      : (attr as "left" | "right" | "bottom-right");
    const point = dockPoint(el, side);
    total += weight;
    dockX += point.x * weight;
    dockY += point.y * weight;
    dockS += (phone ? 0.46 : attr === "bottom-right" ? 0.44 : 0.5) * weight;
  });

  if (total > 0.0001) {
    dockX /= total;
    dockY /= total;
    dockS /= total;
  } else {
    dockX = rest.x;
    dockY = rest.y;
    dockS = rest.scale;
  }

  const strolledX = lerp(base.x, dockX, leave);
  const strolledY = lerp(base.y, dockY, leave);
  const strolledS = lerp(base.scale, dockS, leave);

  // After the last feature ("Está bom quando cede"), drift off to the side.
  const last = docks[docks.length - 1];
  const lastRect = last.getBoundingClientRect();
  const lastAnchor = lastRect.top + lastRect.height * 0.4;
  const exit = smoothstep((vh * 0.52 - lastAnchor) / (vh * 0.7));
  const aspect = window.innerWidth / window.innerHeight;
  const visibleH = 2 * Math.tan((CAMERA_FOV * Math.PI) / 180 / 2) * CAMERA_Z;
  const offX = (visibleH * aspect) * 0.5 + 2.2;

  scene.x = lerp(strolledX, offX, exit);
  scene.y = lerp(strolledY, strolledY * 0.35 - 0.08, exit);
  scene.scale = lerp(strolledS, strolledS * 0.82, exit);
  scene.ry = base.ry + progress * Math.PI * 2.1 + exit * 0.7;
  scene.opacity = 1;
}

function FeatureBlock({ feature, index }: { feature: Feature; index: number }) {
  const flip = feature.flip;
  return (
    <article
      className={`feature-block ${flip ? "feature-block--flip" : ""}`}
      data-feature={index}
    >
      <FadeUp className="feature-block__copy" delay={0.04}>
        <p className="feature-block__eyebrow">{feature.eyebrow}</p>
        <SplitText
          as="h2"
          text={feature.title}
          mode="words"
          className="feature-block__title font-display"
          stagger={0.07}
        />
        <p className="feature-block__text">{feature.copy}</p>
      </FadeUp>

      <FadeUp className="feature-block__visual" delay={0.1}>
        <div
          className={`feature-block__stage ${feature.inset ? "feature-block__stage--layered" : ""}`}
          data-berry-dock={feature.dock ?? (flip ? "right" : "left")}
        >
          <div className="feature-block__panel" aria-hidden="true" />
          <ParallaxMedia
            src={feature.image}
            alt={feature.alt}
            className="feature-block__photo"
            strength={14}
          />
          {feature.inset ? (
            <div className="feature-block__inset">
              <img src={feature.inset} alt={feature.insetAlt ?? ""} loading="lazy" draggable={false} />
            </div>
          ) : null}
        </div>
      </FadeUp>
    </article>
  );
}

export function Story() {
  const reduced = useReduced();
  const words = useList("home.marquee.words");
  const intro = useText("home.hero.intro");
  const { content } = useSite();
  const features: Feature[] = featureLayout.map((layout, i) => ({
    ...layout,
    eyebrow: String(content[`home.feature${i + 1}.eyebrow`] ?? ""),
    title: String(content[`home.feature${i + 1}.title`] ?? ""),
    copy: String(content[`home.feature${i + 1}.copy`] ?? ""),
  }));
  const loop = [...words, ...words];
  const titleWordRef = useRef<HTMLSpanElement>(null);
  const copyRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  useArrive();

  useLayoutEffect(() => {
    if (reduced) {
      const base = heroRest();
      scene.x = base.x;
      scene.y = base.y;
      scene.scale = base.scale;
      scene.ry = base.ry;
      scene.opacity = 1;
      scene.idle = true;
      if (titleWordRef.current) {
        titleWordRef.current.style.transform = "translateY(0)";
        titleWordRef.current.style.transitionDelay = "0s";
      }
      copyRef.current?.classList.add("is-in");
      ctaRef.current?.classList.add("is-in");
      return;
    }

    scene.x = 0;
    scene.y = 4.8;
    scene.scale = 0.42;
    scene.ry = 0.1;
    scene.opacity = 0;
    scene.idle = false;

    let killed = false;
    let tl: gsap.core.Timeline | null = null;
    let scrollCtx: gsap.Context | null = null;

    const armScroll = () => {
      scrollCtx = gsap.context(() => {
        const story = ScrollTrigger.create({
          trigger: "#story",
          start: "top top",
          end: "bottom bottom",
          scrub: true,
          onUpdate: (self) => strollBerry(self.progress),
        });
        const onResize = () => strollBerry(story.progress);
        window.addEventListener("resize", onResize);

        ScrollTrigger.create({
          trigger: "#passeio",
          start: "top 85%",
          end: "bottom top",
          scrub: true,
          onUpdate: (self) => strollBerry(self.progress),
        });

        // Keep updating while leaving passeio into the following sections,
        // so the berry stays off-screen until the user scrolls back up.
        ScrollTrigger.create({
          trigger: "#sobre",
          start: "top bottom",
          end: "bottom top",
          scrub: true,
          onUpdate: (self) => strollBerry(0.85 + self.progress * 0.15),
        });

        return () => window.removeEventListener("resize", onResize);
      });
    };

    const playEntrance = () => {
      if (killed || tl) return;
      const word = titleWordRef.current;
      const copy = copyRef.current;
      const cta = ctaRef.current;

      tl = gsap.timeline({
        delay: 0,
        defaults: { ease: "power3.out" },
        onComplete: () => {
          strollBerry(0);
          scene.idle = true;
          armScroll();
        },
      });

      tl.add(() => {
        if (!word) return;
        word.style.transitionDelay = "0.1s";
        word.style.transform = "translateY(0)";
      }, 0.08);

      const base = heroRest();
      tl.to(
        scene,
        {
          opacity: 1,
          x: base.x,
          y: base.y,
          scale: base.scale,
          ry: base.ry + Math.PI * 1.35,
          duration: 1.45,
          ease: "power3.out",
        },
        0.45,
      );

      const afterBerry = 1.65;
      tl.add(() => copy?.classList.add("is-in"), afterBerry);
      tl.add(() => cta?.classList.add("is-in"), afterBerry + 0.3);
    };

    if (document.documentElement.dataset.opened) {
      playEntrance();
    } else {
      const mo = new MutationObserver(() => {
        if (document.documentElement.dataset.opened) {
          playEntrance();
          mo.disconnect();
        }
      });
      mo.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["data-opened"],
      });
      return () => {
        killed = true;
        mo.disconnect();
        tl?.kill();
        scrollCtx?.revert();
        const base = heroRest();
        scene.x = base.x;
        scene.y = base.y;
        scene.scale = base.scale;
        scene.ry = base.ry;
        scene.opacity = 1;
        scene.idle = true;
      };
    }

    return () => {
      killed = true;
      tl?.kill();
      scrollCtx?.revert();
      const base = heroRest();
      scene.x = base.x;
      scene.y = base.y;
      scene.scale = base.scale;
      scene.ry = base.ry;
      scene.opacity = 1;
      scene.idle = true;
    };
  }, [reduced]);

  return (
    <div id="story">
      <section
        id="hero"
        className="relative flex min-h-[100dvh] flex-col justify-end overflow-hidden bg-transparent px-5 pt-24 pb-8 md:px-10 md:pb-10"
      >
        {reduced ? <BerryCanvas inline /> : null}

        <h1
          className="pointer-events-none absolute inset-x-0 top-1/2 z-[1] -translate-y-[52%] overflow-hidden text-center font-display leading-[0.78] tracking-[-0.045em] text-ink whitespace-nowrap"
          style={{ fontSize: "clamp(4rem, 21vw, 22rem)" }}
          aria-label="medronho"
        >
          <span className="hero-word-mask">
            <span ref={titleWordRef} className="hero-word" aria-hidden="true">
              medronho
            </span>
          </span>
        </h1>

        <div className="relative z-20 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <p ref={copyRef} className="fade-up max-w-[42ch] text-lg leading-relaxed text-ink">
            {withSpecies(intro)}
          </p>
          <div ref={ctaRef} className="fade-up flex flex-wrap gap-3">
            <Pill to="/consorcio">Sobre o consórcio</Pill>
            <Pill to="/noticias" tone="ghost">
              Ver notícias
            </Pill>
          </div>
        </div>
      </section>

      <section className="overflow-hidden bg-ink text-butter" aria-label="Palavras sobre o medronho">
        <p className="sr-only">{words.join(", ")}</p>
        <div className="marquee-track py-7" aria-hidden="true">
          {loop.map((word, index) => (
            <span
              key={`${word}-${index}`}
              className="px-8 font-display text-[clamp(1.8rem,4.5vw,4rem)] leading-none tracking-[-0.03em]"
            >
              {word}
            </span>
          ))}
        </div>
      </section>

      <section id="passeio" className="feature-rail bg-transparent text-ink">
        {features.map((feature, index) => (
          <FeatureBlock key={feature.title} feature={feature} index={index} />
        ))}
      </section>
    </div>
  );
}
