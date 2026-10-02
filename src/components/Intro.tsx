import { useEffect, useMemo, useRef, useState } from "react";
import { fruits } from "../fruits";
import { runFruitPhysics } from "../fruitPhysics";
import { gsap } from "../gsap";
import { scrollBus } from "../scene";
import { useReduced } from "../useReduced";

const WORD = "UNEDO4ALL";
const O_INDEX = 4; // the O in UNEDO
/** Temporarily hide falling medronhos in the loader. */
const SHOW_FALLING_FRUIT = false;

function markOpened() {
  document.documentElement.dataset.opened = "true";
}

function uniqueIds(html: string, tag: string) {
  return html
    .replace(/\sid="([^"]+)"/g, (_match, id: string) => ` id="${id}-${tag}"`)
    .replace(/url\(#([^)]+)\)/g, (_match, id: string) => `url(#${id}-${tag})`);
}

function setCircleMask(el: HTMLElement, cx: number, cy: number, radius: number) {
  if (radius < 0.5) {
    el.style.maskImage = "none";
    el.style.webkitMaskImage = "none";
    return;
  }
  const mask = `radial-gradient(circle ${radius}px at ${cx}px ${cy}px, transparent 98.5%, #000 100%)`;
  el.style.maskImage = mask;
  el.style.webkitMaskImage = mask;
}

export function Intro() {
  const reduced = useReduced();
  const [gone, setGone] = useState(() => reduced);
  const [progress, setProgress] = useState(0);

  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const brandRef = useRef<HTMLDivElement>(null);
  const oRef = useRef<HTMLSpanElement>(null);
  const ballRef = useRef<HTMLSpanElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);

  const pile = useMemo(
    () =>
      [0, 1].flatMap((copy) =>
        fruits.map((fruit, index) => ({
          ...fruit,
          html: uniqueIds(fruit.html, `loader-${copy}-${index}`),
          scale: fruit.scale * 0.8 * (0.9 + ((copy * 7 + index) % 5) * 0.05),
          key: `${copy}-${index}`,
        })),
      ),
    [],
  );

  useEffect(() => {
    if (reduced) {
      markOpened();
      setGone(true);
      return;
    }

    const root = rootRef.current;
    const stage = stageRef.current;
    const brand = brandRef.current;
    const oMark = oRef.current;
    const ball = ballRef.current;
    const progressEl = progressRef.current;
    const bar = barRef.current;
    if (!root || !stage || !brand || !oMark || !ball || !progressEl || !bar) return;

    document.documentElement.style.overflow = "hidden";
    scrollBus.loco?.stop();

    const hole = { r: 0, cx: 0, cy: 0 };
    const tracker = { value: 0 };
    let settled = false;
    let progressDone = false;
    let closing = false;
    let physics: ReturnType<typeof runFruitPhysics> = null;
    const timers: number[] = [];
    let openTl: gsap.core.Timeline | null = null;

    const syncHoleCenter = () => {
      const rect = ball.getBoundingClientRect();
      hole.cx = rect.left + rect.width / 2;
      hole.cy = rect.top + rect.height / 2;
    };

    const applyHole = () => {
      setCircleMask(root, hole.cx, hole.cy, hole.r);
    };

    const openCurtain = () => {
      if (closing) return;
      closing = true;
      physics?.destroy();
      physics = null;
      root.dataset.phase = "open";

      syncHoleCenter();
      const ballRect = ball.getBoundingClientRect();
      const startR = Math.max(6, ballRect.width / 2);
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const span =
        Math.hypot(
          Math.max(hole.cx, vw - hole.cx),
          Math.max(hole.cy, vh - hole.cy),
        ) + 64;

      const otherLetters = brand.querySelectorAll<HTMLElement>(
        ".fruit-loader__char:not([data-o='true']) .fruit-loader__char-inner",
      );
      const oRing = oMark.querySelector<HTMLElement>(".fruit-loader__o-ring");
      const oLetter = oMark.querySelector<HTMLElement>(".fruit-loader__o-letter");

      // One ball only: hand the yellow circle to the mask, then hide the painted ball.
      hole.r = startR;
      applyHole();
      gsap.set(ball, { opacity: 0 });

      openTl = gsap
        .timeline({
          onComplete: () => setGone(true),
        })
        .to(progressEl, { opacity: 0, duration: 0.35, ease: "power2.out" }, 0)
        .to(
          otherLetters,
          {
            opacity: 0,
            y: -22,
            duration: 0.55,
            ease: "power2.in",
            stagger: { each: 0.028, from: "center" },
          },
          0.1,
        )
        .to([oLetter, oRing].filter(Boolean), { opacity: 0, duration: 0.35, ease: "power2.in" }, 0.18)
        .to(stage, { opacity: 0, duration: 0.4, ease: "power2.out" }, 0.2)
        .to(
          hole,
          {
            r: span,
            duration: 1.65,
            ease: "expo.inOut",
            onUpdate: () => {
              syncHoleCenter();
              applyHole();
            },
          },
          0.22,
        );
    };

    const maybeOpen = () => {
      if (settled && progressDone) openCurtain();
    };

    const inners = brand.querySelectorAll<HTMLElement>(".fruit-loader__char-inner");
    const oUnit = oMark.querySelector<HTMLElement>(".fruit-loader__o-unit");
    const oRing = oMark.querySelector<HTMLElement>(".fruit-loader__o-ring");
    const oLetter = oMark.querySelector<HTMLElement>(".fruit-loader__o-letter");
    let ballShown = false;

    // Pin the yellow counter to the Paytone "O" ink center / counter
    const fitOCounter = () => {
      if (!oRing || !oLetter) return;
      const size = parseFloat(getComputedStyle(oLetter).fontSize);
      if (!size) return;
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const font = getComputedStyle(oLetter);
      ctx.font = `${font.fontWeight} ${size}px ${font.fontFamily}`;
      ctx.textBaseline = "alphabetic";
      const metrics = ctx.measureText("O");
      const inkH =
        (metrics.actualBoundingBoxAscent || size * 0.7) +
        (metrics.actualBoundingBoxDescent || 0);
      // Paytone One: ink center sits ~0.57em below the content box top
      oRing.style.top = `${size * 0.57}px`;
      oRing.style.width = `${inkH * 0.52}px`;
      oRing.style.height = `${inkH * 0.52}px`;
      ball.style.width = `${inkH * 0.44}px`;
      ball.style.height = `${inkH * 0.44}px`;
    };

    void document.fonts.ready.then(fitOCounter);
    fitOCounter();

    gsap.set(inners, { yPercent: 110, opacity: 0 });
    if (oUnit) gsap.set(oUnit, { yPercent: 110, opacity: 0 });
    gsap.set(ball, { opacity: 0 });
    gsap.set(progressEl, { opacity: 1 });
    gsap.set(stage, { opacity: 1 });
    hole.r = 0;
    applyHole();

    // Letter staircase
    gsap.to(inners, {
      yPercent: 0,
      opacity: 1,
      duration: 0.95,
      ease: "power3.out",
      stagger: 0.055,
      delay: 0.18,
    });

    // O ring rises with the word; yellow ball waits for 80%
    if (oUnit) {
      gsap.to(oUnit, {
        yPercent: 0,
        opacity: 1,
        duration: 0.95,
        ease: "power3.out",
        delay: 0.18 + O_INDEX * 0.055,
      });
    }

    const showBall = () => {
      if (ballShown) return;
      ballShown = true;
      gsap.to(ball, { opacity: 1, duration: 0.55, ease: "power2.out" });
    };

    if (SHOW_FALLING_FRUIT) {
      physics = runFruitPhysics(stage, {
        gravity: 1.35,
        settledRatio: 0.8,
        onSettled: () => {
          settled = true;
          maybeOpen();
        },
      });
    } else {
      settled = true;
      gsap.set(stage, { opacity: 0, visibility: "hidden" });
    }

    gsap.to(tracker, {
      value: 100,
      duration: 2.4,
      delay: 0.25,
      ease: "power2.inOut",
      onUpdate: () => {
        bar.style.width = `${tracker.value}%`;
        setProgress(Math.round(tracker.value));
        if (tracker.value >= 80) showBall();
      },
      onComplete: () => {
        showBall();
        progressDone = true;
        timers.push(window.setTimeout(maybeOpen, 280));
      },
    });

    const closeDelay = window.matchMedia("(max-width: 480px)").matches ? 5200 : 4800;
    timers.push(
      window.setTimeout(() => {
        settled = true;
        progressDone = true;
        openCurtain();
      }, closeDelay),
    );

    const skip = (event: KeyboardEvent) => {
      if (event.key === "Escape" || event.key === "Enter") {
        settled = true;
        progressDone = true;
        openCurtain();
      }
    };
    const onResize = () => {
      if (hole.r > 0.5) {
        syncHoleCenter();
        applyHole();
      }
    };
    window.addEventListener("keydown", skip);
    window.addEventListener("resize", onResize);

    return () => {
      physics?.destroy();
      timers.forEach((id) => window.clearTimeout(id));
      openTl?.kill();
      gsap.killTweensOf([tracker, hole, inners, oUnit, ball, progressEl, stage, brand]);
      window.removeEventListener("keydown", skip);
      window.removeEventListener("resize", onResize);
    };
  }, [reduced]);

  useEffect(() => {
    if (!gone) return;
    markOpened();
    scrollBus.loco?.start();
    document.documentElement.style.overflow = "";
  }, [gone]);

  if (gone) return null;

  return (
    <div className="fruit-loader" data-phase="in" aria-hidden="true" ref={rootRef}>
      <p className="sr-only" role="status">
        A abrir o site. {progress}%
      </p>

      <div
        ref={stageRef}
        className="fruit-loader__stage"
        data-fruit-loader-ready="false"
        hidden={!SHOW_FALLING_FRUIT}
      >
        {SHOW_FALLING_FRUIT &&
          pile.map((fruit) => (
            <div
              key={fruit.key}
              className="fruit-loader__fruit"
              data-fruit=""
              style={{
                width: `calc(var(--fruit-base, 6rem) * ${fruit.scale})`,
                aspectRatio: fruit.ratio,
                minWidth: 72,
                minHeight: 72,
              }}
              dangerouslySetInnerHTML={{ __html: fruit.html }}
            />
          ))}
      </div>

      <div ref={brandRef} className="fruit-loader__brand" aria-label="UNEDO4ALL">
        {Array.from(WORD).map((char, index) => {
          const isO = index === O_INDEX;
          if (isO) {
            return (
              <span
                key={`${char}-${index}`}
                className="fruit-loader__char fruit-loader__char--o"
                ref={oRef}
                data-o="true"
              >
                <span className="fruit-loader__char-clip">
                  <span className="fruit-loader__o-unit">
                    <span className="fruit-loader__o-letter">O</span>
                    <span className="fruit-loader__o-ring" aria-hidden="true">
                      <span ref={ballRef} className="fruit-loader__ball" aria-hidden="true" />
                    </span>
                  </span>
                </span>
              </span>
            );
          }
          return (
            <span key={`${char}-${index}`} className="fruit-loader__char">
              <span className="fruit-loader__char-clip">
                <span className="fruit-loader__char-inner">{char}</span>
              </span>
            </span>
          );
        })}
      </div>

      <div ref={progressRef} className="fruit-loader__progress">
        <span className="fruit-loader__pct">{progress}%</span>
        <div className="fruit-loader__track">
          <div ref={barRef} className="fruit-loader__bar" />
        </div>
      </div>
    </div>
  );
}
