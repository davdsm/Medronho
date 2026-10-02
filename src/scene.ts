import type LocomotiveScroll from "locomotive-scroll";

export const scene = {
  x: 0,
  y: 4.6,
  scale: 0.42,
  ry: 0.15,
  opacity: 0,
  idle: false,
  lookX: 0,
  lookY: 0,
};

export const scrollBus: { loco: LocomotiveScroll | null } = { loco: null };
