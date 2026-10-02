import { useEffect, useMemo, useRef, useState } from "react";
import { fruits } from "../fruits";
import { runFruitPhysics } from "../fruitPhysics";
import { scrollBus } from "../scene";
import { useReduced } from "../useReduced";

type Phase = "in" | "open" | "gone";

function markOpened() {
  document.documentElement.dataset.opened = "true";
}

function uniqueIds(html: string, tag: string) {
  return html.replace(/\sid="([^"]+)"/g, (_match, id: string) => ` id="${id}-${tag}"`)
    .replace(/url\(#([^)]+)\)/g, (_match, id: string) => `url(#${id}-${tag})`);
}

export function Intro() {
  const reduced = useReduced();
  const [phase, setPhase] = useState<Phase>(() => (reduced ? "gone" : "in"));
  const [progress, setProgress] = useState(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const settled = useRef(false);
  const progressDone = useRef(false);
  const closing = useRef(false);

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
      setPhase("gone");
      return;
    }

    if (phase === "gone") {
      // Only now — after the loader is fully gone — start hero entrance.
      markOpened();
      scrollBus.loco?.start();
      document.documentElement.style.overflow = "";
      return;
    }

    document.documentElement.style.overflow = "hidden";
    scrollBus.loco?.stop();

    if (phase === "open") {
      // Fruits are already unmounted; wait for the butter sweep, then reveal the site.
      const done = window.setTimeout(() => setPhase("gone"), 1050);
      return () => window.clearTimeout(done);
    }

    const stage = stageRef.current;
    if (!stage) return;

    settled.current = false;
    progressDone.current = false;
    closing.current = false;

    const closeDelay = window.matchMedia("(max-width: 480px)").matches ? 4200 : 3600;
    let physics: ReturnType<typeof runFruitPhysics> = null;
    let raf = 0;
    let timers: number[] = [];

    const close = () => {
      if (closing.current) return;
      closing.current = true;
      physics?.destroy();
      physics = null;
      setPhase("open");
    };

    const maybeClose = () => {
      if (settled.current && progressDone.current) close();
    };

    physics = runFruitPhysics(stage, {
      gravity: 1.35,
      settledRatio: 0.8,
      onSettled: () => {
        settled.current = true;
        maybeClose();
      },
    });

    timers.push(
      window.setTimeout(() => {
        const startAt = performance.now();
        const duration = 1700;
        const tick = () => {
          const t = Math.min(1, (performance.now() - startAt) / duration);
          setProgress(Math.round((1 - (1 - t) ** 3) * 100));
          if (t < 1) return;
          window.clearInterval(raf);
          raf = 0;
          progressDone.current = true;
          maybeClose();
        };
        raf = window.setInterval(tick, 32);
        tick();
      }, 120),
    );

    timers.push(window.setTimeout(close, closeDelay));

    const skip = (event: KeyboardEvent) => {
      if (event.key === "Escape" || event.key === "Enter") close();
    };
    window.addEventListener("keydown", skip);

    return () => {
      physics?.destroy();
      if (raf) window.clearInterval(raf);
      timers.forEach((id) => window.clearTimeout(id));
      window.removeEventListener("keydown", skip);
    };
  }, [phase, reduced]);

  if (phase === "gone") return null;

  return (
    <div className="fruit-loader" data-phase={phase} aria-hidden="true">
      <p className="sr-only" role="status">
        A abrir o site. {progress}%
      </p>
      <div className="fruit-loader__content">
        <div className="fruit-loader__mark">{progress}%</div>
        {phase === "in" ? (
          <div ref={stageRef} className="fruit-loader__stage" data-fruit-loader-ready="false">
            {pile.map((fruit) => (
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
        ) : null}
      </div>
      <div className="fruit-loader__sweep">
        <div className="fruit-loader__sweep-panel" />
        <div className="fruit-loader__sweep-line" />
      </div>
    </div>
  );
}
