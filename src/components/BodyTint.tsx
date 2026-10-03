import { useLayoutEffect } from "react";
import { gsap, ScrollTrigger } from "../gsap";

type PageTone = "butter" | "beige" | "ink";

const TONES: Record<PageTone, string> = {
  butter: "var(--color-butter)",
  beige: "var(--color-beige)",
  ink: "var(--color-ink)",
};

function setTone(tone: PageTone) {
  const root = document.documentElement;
  if (root.dataset.pageTone === tone) return;
  root.dataset.pageTone = tone;
  root.style.setProperty("--page-bg", TONES[tone]);
}

/**
 * Discrete body color swaps at section milestones.
 * Ink locks once logos are ≥50% in view and stays through news/footer.
 * It only releases when scrolling back up past that logos threshold.
 */
export function BodyTint() {
  useLayoutEffect(() => {
    setTone("butter");
    let inkLocked = false;

    const ctx = gsap.context(() => {
      const hero = document.getElementById("hero");
      const logos = document.getElementById("logos");
      if (!hero || !logos) return;

      const apply = () => {
        const vh = window.innerHeight || 1;
        const logosRect = logos.getBoundingClientRect();
        const logosVisible =
          Math.min(logosRect.bottom, vh) - Math.max(logosRect.top, 0);
        const ratio = gsap.utils.clamp(
          0,
          1,
          logosVisible / Math.max(1, Math.min(logosRect.height, vh)),
        );

        // Enter dark when logos are half visible.
        if (ratio >= 0.5) {
          inkLocked = true;
          setTone("ink");
          return;
        }

        // Stay dark after logos (news, footer…) until we scroll back up
        // past the mid-point of that section.
        if (inkLocked) {
          if (logosRect.top < vh * 0.5) {
            setTone("ink");
            return;
          }
          inkLocked = false;
        }

        const heroBottom = hero.getBoundingClientRect().bottom;
        if (heroBottom <= vh * 0.12) {
          setTone("beige");
          return;
        }

        setTone("butter");
      };

      ScrollTrigger.create({
        trigger: document.documentElement,
        start: "top top",
        end: "bottom bottom",
        onUpdate: apply,
        onRefresh: apply,
      });

      apply();
    });

    return () => {
      ctx.revert();
      const root = document.documentElement;
      delete root.dataset.pageTone;
      root.style.setProperty("--page-bg", TONES.butter);
    };
  }, []);

  return null;
}
