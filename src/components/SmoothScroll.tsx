import { useLayoutEffect } from "react";
import LocomotiveScroll from "locomotive-scroll";
import { gsap, ScrollTrigger } from "../gsap";
import { scrollBus } from "../scene";

export function SmoothScroll() {
  useLayoutEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const loco = new LocomotiveScroll({
      lenisOptions: {
        lerp: 0.09,
        anchors: true,
        stopInertiaOnNavigate: true,
        autoRaf: false,
        // Nested horizontal carousels (news) keep sideways gestures.
        allowNestedScroll: true,
      },
      scrollCallback: () => ScrollTrigger.update(),
      initCustomTicker: (render) => {
        gsap.ticker.add(render);
      },
      destroyCustomTicker: (render) => {
        gsap.ticker.remove(render);
      },
    });

    scrollBus.loco = loco;
    gsap.ticker.lagSmoothing(0);

    const refresh = () => {
      loco.resize();
      ScrollTrigger.refresh();
    };
    window.addEventListener("load", refresh);
    void document.fonts.ready.then(refresh);

    return () => {
      window.removeEventListener("load", refresh);
      loco.destroy();
      scrollBus.loco = null;
    };
  }, []);

  return null;
}
