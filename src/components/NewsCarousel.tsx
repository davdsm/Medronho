import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { usePosts } from "../content";
import { formatDate } from "../lib/types";

function ArrowIcon({ direction }: { direction: "prev" | "next" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className="h-5 w-5"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {direction === "prev" ? (
        <path d="M14.5 5.5 8 12l6.5 6.5" />
      ) : (
        <path d="M9.5 5.5 16 12l-6.5 6.5" />
      )}
    </svg>
  );
}

/** Free horizontal scroller — native touch, light desktop drag, no snap fighting. */
export function NewsCarousel() {
  const { featured: posts } = usePosts();
  const scroller = useRef<HTMLUListElement>(null);
  const drag = useRef({
    active: false,
    moved: false,
    startX: 0,
    startLeft: 0,
    pointerId: -1,
  });
  const [grabbing, setGrabbing] = useState(false);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;

    const maxScroll = () => Math.max(0, el.scrollWidth - el.clientWidth);

    const syncEdges = () => {
      const max = maxScroll();
      const left = el.scrollLeft;
      setAtStart(left <= 2);
      setAtEnd(left >= max - 2);
    };

    const step = () => {
      const card = el.querySelector("li");
      if (!card) return el.clientWidth * 0.75;
      const styles = getComputedStyle(el);
      const gap = Number.parseFloat(styles.columnGap || styles.gap || "20") || 20;
      return card.getBoundingClientRect().width + gap;
    };

    const go = (direction: -1 | 1) => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      el.scrollBy({
        left: direction * step(),
        behavior: reduce ? "auto" : "smooth",
      });
    };

    // Expose for buttons via dataset bridge
    (el as HTMLUListElement & { __go?: typeof go }).__go = go;

    const onPointerDown = (event: PointerEvent) => {
      // Touch / pen: let the browser do native free scrolling.
      if (event.pointerType === "touch" || event.pointerType === "pen") return;
      if (event.button !== 0) return;
      drag.current = {
        active: true,
        moved: false,
        startX: event.clientX,
        startLeft: el.scrollLeft,
        pointerId: event.pointerId,
      };
      setGrabbing(true);
      el.classList.add("is-dragging");
      el.setPointerCapture(event.pointerId);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!drag.current.active || event.pointerId !== drag.current.pointerId) return;
      const delta = event.clientX - drag.current.startX;
      if (Math.abs(delta) > 4) drag.current.moved = true;
      el.scrollLeft = drag.current.startLeft - delta;
      syncEdges();
    };

    const endDrag = (event: PointerEvent) => {
      if (!drag.current.active) return;
      if (event.pointerId !== drag.current.pointerId && event.type !== "pointercancel") return;
      drag.current.active = false;
      setGrabbing(false);
      el.classList.remove("is-dragging");
      try {
        el.releasePointerCapture(event.pointerId);
      } catch {
        /* ignore */
      }
      syncEdges();
    };

    const onClickCapture = (event: MouseEvent) => {
      if (drag.current.moved) {
        event.preventDefault();
        event.stopPropagation();
        drag.current.moved = false;
      }
    };

    const onWheel = (event: WheelEvent) => {
      // Map vertical wheel to horizontal when the gesture is mostly sideways / trackpad.
      if (Math.abs(event.deltaX) <= Math.abs(event.deltaY) && Math.abs(event.deltaX) < 1.5) return;
      event.preventDefault();
      el.scrollLeft += event.deltaX + event.deltaY;
      syncEdges();
    };

    syncEdges();
    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", endDrag);
    el.addEventListener("pointercancel", endDrag);
    el.addEventListener("click", onClickCapture, true);
    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("scroll", syncEdges, { passive: true });
    window.addEventListener("resize", syncEdges);

    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", endDrag);
      el.removeEventListener("pointercancel", endDrag);
      el.removeEventListener("click", onClickCapture, true);
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("scroll", syncEdges);
      window.removeEventListener("resize", syncEdges);
      delete (el as HTMLUListElement & { __go?: typeof go }).__go;
    };
  }, []);

  const go = (direction: -1 | 1) => {
    const el = scroller.current as (HTMLUListElement & { __go?: (d: -1 | 1) => void }) | null;
    el?.__go?.(direction);
  };

  return (
    <div className="news-bleed">
      <div className="news-edge mb-5 flex items-center justify-between gap-4">
        <p className="text-sm text-foam-soft">Arrasta para ver as notícias.</p>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            className="news-arrow"
            aria-label="Notícia anterior"
            disabled={atStart}
            onClick={() => go(-1)}
          >
            <ArrowIcon direction="prev" />
          </button>
          <button
            type="button"
            className="news-arrow"
            aria-label="Notícia seguinte"
            disabled={atEnd}
            onClick={() => go(1)}
          >
            <ArrowIcon direction="next" />
          </button>
        </div>
      </div>
      <ul
        ref={scroller}
        className={`news-drag flex gap-5 overflow-x-auto pb-2 md:gap-6 ${
          grabbing ? "is-dragging" : ""
        }`}
      >
        {posts.map((post) => (
          <li
            key={post.slug}
            className="w-[min(78vw,28rem)] shrink-0 md:w-[min(40vw,30rem)]"
          >
            <Link to={`/noticias/${post.slug}`} className="group block" draggable={false}>
              <div className="aspect-[4/3] w-full overflow-hidden rounded-[1.25rem]">
                <img
                  src={post.image}
                  alt={post.imageAlt}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  draggable={false}
                />
              </div>
              <p className="mt-4 text-sm text-foam-soft">{formatDate(post.publishedAt)}</p>
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
