import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { posts } from "../data";
import { ParallaxMedia } from "./Parallax";

export function NewsCarousel() {
  const scroller = useRef<HTMLUListElement>(null);
  const drag = useRef({
    active: false,
    startX: 0,
    startLeft: 0,
    lastX: 0,
    lastT: 0,
    velocity: 0,
    moved: false,
    pointerId: -1,
  });
  const motion = useRef({
    target: 0,
    raf: 0,
  });
  const [grabbing, setGrabbing] = useState(false);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    motion.current.target = el.scrollLeft;

    const maxScroll = () => Math.max(0, el.scrollWidth - el.clientWidth);

    const clamp = (value: number) => Math.min(maxScroll(), Math.max(0, value));

    const stopLoop = () => {
      if (motion.current.raf) {
        cancelAnimationFrame(motion.current.raf);
        motion.current.raf = 0;
      }
    };

    const tick = () => {
      const state = drag.current;
      const current = el.scrollLeft;
      const target = motion.current.target;

      if (state.active) {
        // Follow the finger closely while dragging.
        el.scrollLeft = current + (target - current) * (reduce ? 1 : 0.42);
        motion.current.raf = requestAnimationFrame(tick);
        return;
      }

      // Coast with friction after release.
      const gap = target - current;
      if (Math.abs(gap) < 0.35 && Math.abs(state.velocity) < 0.02) {
        el.scrollLeft = target;
        state.velocity = 0;
        motion.current.raf = 0;
        el.classList.remove("is-dragging");
        return;
      }

      state.velocity *= 0.94;
      motion.current.target = clamp(target + state.velocity * 16);
      el.scrollLeft = current + (motion.current.target - current) * 0.18;
      motion.current.raf = requestAnimationFrame(tick);
    };

    const ensureLoop = () => {
      if (!motion.current.raf) motion.current.raf = requestAnimationFrame(tick);
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      const now = performance.now();
      drag.current = {
        active: true,
        startX: event.clientX,
        startLeft: el.scrollLeft,
        lastX: event.clientX,
        lastT: now,
        velocity: 0,
        moved: false,
        pointerId: event.pointerId,
      };
      motion.current.target = el.scrollLeft;
      setGrabbing(true);
      el.classList.add("is-dragging");
      el.setPointerCapture(event.pointerId);
      ensureLoop();
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!drag.current.active) return;
      const now = performance.now();
      const delta = event.clientX - drag.current.startX;
      const step = event.clientX - drag.current.lastX;
      const dt = Math.max(8, now - drag.current.lastT);
      if (Math.abs(delta) > 3) drag.current.moved = true;

      // px/ms → px/frame-ish, smoothed so it doesn't feel jittery.
      const instant = (-step / dt) * 16;
      drag.current.velocity = drag.current.velocity * 0.65 + instant * 0.35;
      drag.current.lastX = event.clientX;
      drag.current.lastT = now;
      motion.current.target = clamp(drag.current.startLeft - delta);
      ensureLoop();
    };

    const end = (event: PointerEvent) => {
      if (!drag.current.active) return;
      if (event.pointerId !== drag.current.pointerId && event.type !== "pointercancel") return;
      drag.current.active = false;
      setGrabbing(false);
      // Keep a bit of throw; soft clamp if almost still.
      if (Math.abs(drag.current.velocity) < 0.4) drag.current.velocity = 0;
      else drag.current.velocity = Math.max(-48, Math.min(48, drag.current.velocity));
      try {
        el.releasePointerCapture(event.pointerId);
      } catch {
        /* ignore */
      }
      ensureLoop();
    };

    const onClickCapture = (event: MouseEvent) => {
      if (drag.current.moved) {
        event.preventDefault();
        event.stopPropagation();
        drag.current.moved = false;
      }
    };

    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaX) < Math.abs(event.deltaY) && Math.abs(event.deltaX) < 2) return;
      event.preventDefault();
      drag.current.velocity = 0;
      motion.current.target = clamp(motion.current.target + event.deltaX + event.deltaY);
      el.classList.add("is-dragging");
      ensureLoop();
    };

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", end);
    el.addEventListener("pointercancel", end);
    el.addEventListener("click", onClickCapture, true);
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      stopLoop();
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", end);
      el.removeEventListener("pointercancel", end);
      el.removeEventListener("click", onClickCapture, true);
      el.removeEventListener("wheel", onWheel);
    };
  }, []);

  return (
    <div className="news-bleed">
      <p className="news-edge mb-5 text-sm text-foam-soft">Arrasta para ver as notícias.</p>
      <ul
        ref={scroller}
        className={`news-drag flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 ${
          grabbing ? "cursor-grabbing is-dragging" : "cursor-grab"
        }`}
        data-lenis-prevent-touch
      >
        {posts.map((post) => (
          <li key={post.slug} className="w-[min(78vw,28rem)] shrink-0 snap-start md:w-[min(42vw,32rem)]">
            <Link to={`/noticias/${post.slug}`} className="group block" draggable={false}>
              <ParallaxMedia
                src={post.image}
                alt={post.alt}
                className="aspect-[4/3] w-full overflow-hidden rounded-[1.25rem]"
                strength={18}
              />
              <p className="mt-4 text-sm text-foam-soft">{post.date}</p>
              <h3 className="mt-1 font-display text-[clamp(1.6rem,2.5vw,2.2rem)] leading-[1.1] tracking-[-0.03em] group-hover:underline">
                {post.title}
              </h3>
              <p className="mt-2 max-w-[36ch] text-lg leading-relaxed">{post.excerpt}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
