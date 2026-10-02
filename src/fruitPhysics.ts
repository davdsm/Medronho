import Matter from "matter-js";

type FruitBody = {
  el: HTMLElement;
  body: Matter.Body;
  offsetX: number;
  offsetY: number;
};

const FLOOR = 240;

export function runFruitPhysics(
  stage: HTMLElement,
  options: {
    gravity?: number;
    settledRatio?: number;
    onSettled?: () => void;
  } = {},
) {
  const nodes = Array.from(stage.querySelectorAll<HTMLElement>("[data-fruit]"));
  if (!nodes.length) return null;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    nodes.forEach((el, index) => {
      const angle = (index / nodes.length) * Math.PI * 2;
      const radius = Math.min(stage.clientWidth, stage.clientHeight) * 0.42;
      const x = stage.clientWidth / 2 + Math.cos(angle) * radius;
      const y = stage.clientHeight / 2 + Math.sin(angle) * radius;
      el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
    });
    stage.dataset.fruitLoaderReady = "true";
    options.onSettled?.();
    return { destroy() {} };
  }

  const { Engine, Composite, Bodies, Body, Mouse, MouseConstraint, Events, Sleeping } = Matter;
  const engine = Engine.create();
  engine.enableSleeping = true;
  engine.gravity.y = options.gravity ?? 1.35;

  let width = stage.clientWidth;
  let height = stage.clientHeight;
  const wall = { isStatic: true, restitution: 0.2, friction: 0.6 };
  const floor = Bodies.rectangle(width / 2, height + FLOOR / 2, width * 3, FLOOR, wall);
  const left = Bodies.rectangle(-FLOOR / 2, height / 2, FLOOR, height * 3, wall);
  const right = Bodies.rectangle(width + FLOOR / 2, height / 2, FLOOR, height * 3, wall);

  Composite.add(engine.world, [floor, left, right]);

  const pack: FruitBody[] = [];
  const spawnTimers: number[] = [];
  let destroyed = false;
  let settled = false;
  let quiet = 0;
  let running = false;
  let pump: number | null = null;

  const start = () => {
    if (running || destroyed) return;
    running = true;
    pump = window.setInterval(() => {
      Engine.update(engine, 1000 / 60);
    }, 16);
  };

  const stop = () => {
    if (!running) return;
    running = false;
    if (pump != null) {
      window.clearInterval(pump);
      pump = null;
    }
  };

  const sync = () => {
    for (const item of pack) {
      const { x, y } = item.body.position;
      item.el.style.transform = `translate(${x - item.offsetX}px, ${y - item.offsetY}px) rotate(${item.body.angle}rad)`;
    }
  };

  // Release fruits one after another, each with its own fall speed.
  nodes.forEach((el, index) => {
    const box = el.getBoundingClientRect();
    const w = box.width || 120;
    const h = box.height || 120;
    const radius = Math.min(w, h) * 0.45;
    const x = Math.max(FLOOR / 4, w * 0.15 + Math.random() * Math.max(1, width - w * 1.3));
    const lane = index % 7;
    const y = -200 - h * 0.55 - lane * 70 - Math.random() * 160 - (index % 3) * 40;
    const angle = (Math.random() - 0.5) * 0.4;

    // 0 = slow float, 1 = quick drop
    const pace = Math.random();
    const frictionAir = 0.016 + (1 - pace) * 0.095;
    const density = 0.001 + pace * 0.004;
    const drop = 0.15 + pace * 3.2 + Math.random() * 0.5;
    const delay = 30 + index * (50 + Math.random() * 100) + Math.random() * 280;

    el.style.opacity = "0";
    el.style.transformOrigin = `${w / 2}px ${h / 2}px`;
    el.style.transform = `translate(${x - w / 2}px, ${y - h / 2}px) rotate(${angle}rad)`;

    spawnTimers.push(
      window.setTimeout(() => {
        if (destroyed) return;
        const body = Bodies.circle(x, y, radius, {
          restitution: 0.02 + Math.random() * 0.04,
          friction: 0.75 + Math.random() * 0.15,
          frictionAir,
          density,
          angle,
          sleepThreshold: 18,
        });
        Body.setVelocity(body, {
          x: (Math.random() - 0.5) * (0.35 + pace * 1.5),
          y: drop,
        });
        Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.09);
        Composite.add(engine.world, body);
        pack.push({ el, body, offsetX: w / 2, offsetY: h / 2 });
        el.style.opacity = "1";
        start();
      }, delay),
    );
  });

  const mouse = Mouse.create(stage);
  const constraint = MouseConstraint.create(engine, {
    mouse,
    constraint: { stiffness: 0.2, render: { visible: false } },
  });
  Composite.add(engine.world, constraint);

  const need = Math.max(1, Math.ceil(nodes.length * Math.min(1, Math.max(0, options.settledRatio ?? 0.8))));

  const afterUpdate = () => {
    sync();
    for (const item of pack) {
      if (item.body.isSleeping && item.body.position.y - item.offsetY < 0) {
        Sleeping.set(item.body, false);
      }
    }
    if (!pack.length) return;
    const asleep = pack.every((item) => item.body.isSleeping);
    if (!settled && options.onSettled && pack.length >= Math.ceil(nodes.length * 0.55)) {
      quiet =
        pack.reduce(
          (count, item) =>
            item.body.isSleeping ||
            (item.body.speed < 0.18 && Math.abs(item.body.angularSpeed) < 0.015)
              ? count + 1
              : count,
          0,
        ) >= need
          ? quiet + 1
          : 0;
      if (quiet >= 10 || (asleep && pack.length === nodes.length)) {
        settled = true;
        options.onSettled();
      }
    }
    if (asleep && pack.length === nodes.length && (settled || !options.onSettled)) stop();
  };

  Events.on(engine, "afterUpdate", afterUpdate);
  stage.dataset.fruitLoaderReady = "true";
  start();

  const onResize = () => {
    width = stage.clientWidth;
    height = stage.clientHeight;
    Matter.Body.setPosition(floor, { x: width / 2, y: height + FLOOR / 2 });
    Matter.Body.setPosition(left, { x: -FLOOR / 2, y: height / 2 });
    Matter.Body.setPosition(right, { x: width + FLOOR / 2, y: height / 2 });
    for (const item of pack) Sleeping.set(item.body, false);
    start();
  };

  window.addEventListener("resize", onResize);
  stage.addEventListener("pointerdown", start);

  return {
    destroy() {
      destroyed = true;
      spawnTimers.forEach((id) => window.clearTimeout(id));
      Events.off(engine, "afterUpdate", afterUpdate);
      window.removeEventListener("resize", onResize);
      stage.removeEventListener("pointerdown", start);
      stop();
      Composite.clear(engine.world, false);
      Engine.clear(engine);
      stage.dataset.fruitLoaderReady = "false";
    },
  };
}
