import { useEffect, useRef, type ReactNode } from "react";

type SplitProps = {
  text: string;
  className?: string;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  mode?: "letters" | "words";
  delay?: number;
  stagger?: number;
  hero?: boolean;
};

/** Masked letter/word rise, same idea as davdsm.pt hero titles. */
export function SplitText({
  text,
  className = "",
  as: Tag = "span",
  mode = "words",
  delay = 0,
  stagger = 0.06,
  hero = false,
}: SplitProps) {
  const parts =
    mode === "letters"
      ? Array.from(text)
      : text.split(/(\s+)/).filter((part) => part.length > 0);

  return (
    <Tag className={`split-text ${className}`} aria-label={text}>
      {parts.map((part, index) => {
        if (mode === "words" && /^\s+$/.test(part)) {
          return <span key={`s-${index}`}>{"\u00A0"}</span>;
        }
        if (mode === "letters" && part === " ") {
          return <span key={`s-${index}`}>{"\u00A0"}</span>;
        }
        return (
          <span key={`${part}-${index}`} className="split-mask" aria-hidden="true">
            <span
              className={hero ? "split-line split-line--hero" : "split-line"}
              style={{ transitionDelay: `${delay + index * stagger}s` }}
            >
              {part}
            </span>
          </span>
        );
      })}
    </Tag>
  );
}

/** Fade + slide up when entering the viewport (or when the site opens). */
export function FadeUp({
  children,
  className = "",
  delay = 0,
  as: Tag = "div",
  hero = false,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "p" | "li" | "section" | "header" | "span";
  hero?: boolean;
}) {
  return (
    <Tag
      className={`fade-up ${className}`}
      data-arrive=""
      {...(hero ? { "data-arrive-hero": "" } : {})}
      style={{ transitionDelay: `${delay}s` }}
    >
      {children}
    </Tag>
  );
}

function holdingPage() {
  return document.documentElement.dataset.ptHold === "true";
}

/** Observe [data-arrive] and mark .is-in. Also reveals split lines under html[data-opened]. */
export function useArrive() {
  const root = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const scope = root.current ?? document;

    const mark = (node: Element) => {
      if (holdingPage()) return;
      node.classList.add("is-in");
      node.querySelectorAll(".split-line").forEach((line) => {
        line.classList.add("is-in");
      });
    };

    const resetHeld = () => {
      scope.querySelectorAll("[data-arrive].is-in").forEach((node) => {
        if (node instanceof HTMLElement && node.closest("#conteudo")) {
          node.classList.remove("is-in");
          node.querySelectorAll(".split-line.is-in").forEach((line) => {
            line.classList.remove("is-in");
          });
        }
      });
    };

    if (reduce) {
      scope.querySelectorAll("[data-arrive], .split-line").forEach((node) => {
        node.classList.add("is-in");
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (holdingPage()) return;
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          mark(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.14, rootMargin: "0px 0px -8% 0px" },
    );

    const watch = () => {
      if (holdingPage()) {
        resetHeld();
        return;
      }
      scope.querySelectorAll("[data-arrive]:not(.is-in)").forEach((node) => {
        observer.observe(node);
      });
    };

    watch();

    const onOpened = () => {
      document.querySelectorAll(".split-line--hero").forEach((line) => {
        line.classList.add("is-in");
      });
      document.querySelectorAll("[data-arrive-hero]").forEach((node) => {
        node.classList.add("is-in");
      });
      watch();
      window.setTimeout(() => {
        import("../gsap").then(({ ScrollTrigger }) => ScrollTrigger.refresh());
      }, 40);
    };

    const onPageReveal = () => {
      // Keep hold while we reset to the hidden start pose (no flash).
      document.documentElement.dataset.ptHold = "true";
      document.querySelectorAll("#conteudo .fade-up, #conteudo .split-line").forEach((node) => {
        node.classList.remove("is-in");
      });

      requestAnimationFrame(() => {
        delete document.documentElement.dataset.ptHold;
        requestAnimationFrame(() => {
          document.querySelectorAll("#conteudo [data-arrive]").forEach((node) => {
            const rect = node.getBoundingClientRect();
            if (rect.top < window.innerHeight * 0.92 && rect.bottom > 0) {
              mark(node);
            } else {
              observer.observe(node);
            }
          });
          import("../gsap").then(({ ScrollTrigger }) => ScrollTrigger.refresh());
        });
      });
    };

    if (document.documentElement.dataset.opened) onOpened();
    else {
      const mo = new MutationObserver(() => {
        if (document.documentElement.dataset.opened) {
          onOpened();
          mo.disconnect();
        }
      });
      mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-opened"] });
      window.addEventListener("medronho:pt-reveal", onPageReveal);
      return () => {
        mo.disconnect();
        observer.disconnect();
        window.removeEventListener("medronho:pt-reveal", onPageReveal);
      };
    }

    window.addEventListener("medronho:pt-reveal", onPageReveal);
    return () => {
      observer.disconnect();
      window.removeEventListener("medronho:pt-reveal", onPageReveal);
    };
  }, []);

  return root;
}
