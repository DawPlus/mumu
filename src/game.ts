export const ROUND_SECONDS = 30;
export const ROOM_LIMIT = 6.4;
export const kinds = {
  can: { tier: 0, radius: 0.2, points: 10, mass: 5, color: "#e98b68" },
  box: { tier: 1, radius: 0.42, points: 30, mass: 14, color: "#d7ae70" },
  shelf: { tier: 2, radius: 0.75, points: 100, mass: 35, color: "#76a29b" },
  fridge: { tier: 3, radius: 0.7, points: 200, mass: 50, color: "#a8c9d3" },
} as const;
export type Kind = keyof typeof kinds;
export interface Item {
  id: number;
  kind: Kind;
  x: number;
  z: number;
  y: number;
  broken: boolean;
  age: number;
  vx: number;
  vz: number;
  vy: number;
  spin: number;
}
export interface Game {
  x: number;
  z: number;
  dx: number;
  dz: number;
  angle: number;
  remaining: number;
  time: number;
  score: number;
  mass: number;
  combo: number;
  comboLeft: number;
  destroyed: number;
  status: "playing" | "finished";
  items: Item[];
  event: string;
  eventUntil: number;
  shake: number;
}
export function growth(mass: number) {
  const tier = mass >= 270 ? 3 : mass >= 130 ? 2 : mass >= 40 ? 1 : 0;
  return {
    tier,
    radius: [0.38, 0.55, 0.76, 1][tier],
    name: ["꼬마 거북이", "통통 거북이", "진열대 파괴자", "마트의 지배자"][
      tier
    ],
    next: [40, 130, 270, Infinity][tier],
    base: [0, 40, 130, 270][tier],
  };
}
export function createGame(): Game {
  const items: Item[] = [];
  const add = (kind: Kind, x: number, z: number) =>
    items.push({
      id: items.length,
      kind,
      x,
      z,
      y: 0,
      broken: false,
      age: 0,
      vx: 0,
      vz: 0,
      vy: 0,
      spin: 0,
    });
  // Small targets connect every aisle, so growth never requires waiting.
  for (const z of [4, 2, 0, -2, -4])
    for (const x of [-4.9, -2.3, 0, 2.3, 4.9])
      for (let k = 0; k < 3; k++)
        add("can", x + (k - 1) * 0.36, z + (k % 2) * 0.28);
  for (const z of [2.9, -0.9, -4.6])
    for (const x of [-1.2, 1.2]) add("box", x, z);
  for (const z of [2.6, -0.4, -3.4])
    for (const x of [-3.5, 3.5]) add("shelf", x, z);
  for (const x of [-4.7, -1.6, 1.6, 4.7]) add("fridge", x, -5.6);
  return {
    x: 0,
    z: 4.8,
    dx: 0,
    dz: 0,
    angle: Math.PI,
    remaining: ROUND_SECONDS,
    time: 0,
    score: 0,
    mass: 0,
    combo: 0,
    comboLeft: 0,
    destroyed: 0,
    status: "playing",
    items,
    event: "오늘은 내가 말썽쟁이!",
    eventUntil: 1.4,
    shake: 0,
  };
}
export function move(s: Game, dx: number, dz: number) {
  if (s.status !== "playing") return;
  if (!Number.isFinite(dx) || !Number.isFinite(dz)) {
    dx = 0;
    dz = 0;
  }
  const length = Math.max(1, Math.hypot(dx, dz));
  s.dx = dx / length;
  s.dz = dz / length;
}
export function step(s: Game, dt: number) {
  if (s.status !== "playing" || !Number.isFinite(dt) || dt <= 0) return;
  const elapsed = Math.min(dt, s.remaining);
  s.time += elapsed;
  s.comboLeft = Math.max(0, s.comboLeft - elapsed);
  if (!s.comboLeft) s.combo = 0;
  s.shake = Math.max(0, s.shake - elapsed * 2.5);
  // Bound physics work after a slow frame, but never discard time from the clock.
  for (let left = Math.min(elapsed, 0.1); left > 1e-8; left -= 1 / 120)
    tick(s, Math.min(left, 1 / 120));
  s.remaining = Math.max(0, s.remaining - elapsed);
  if (s.remaining < 1e-8) {
    s.remaining = 0;
    s.status = "finished";
    s.dx = 0;
    s.dz = 0;
  }
}
function tick(s: Game, dt: number) {
  const g = growth(s.mass),
    speed = 4.4 + g.tier * 0.35,
    moving = Math.hypot(s.dx, s.dz) > 0.02;
  if (moving) {
    s.x += s.dx * speed * dt;
    s.z += s.dz * speed * dt;
    s.angle = Math.atan2(s.dx, s.dz);
  }
  for (const item of s.items) {
    if (item.broken) {
      item.age += dt;
      if (item.age < 2.5) {
        item.x += item.vx * dt;
        item.z += item.vz * dt;
        item.y = Math.max(0, item.y + item.vy * dt);
        item.vy -= 12 * dt;
        item.vx *= Math.exp(-2 * dt);
        item.vz *= Math.exp(-2 * dt);
        item.spin += dt * 5;
        if (item.y === 0 && item.vy < 0) item.vy = Math.abs(item.vy) * 0.25;
      }
      continue;
    }
    if (!moving) continue;
    const spec = kinds[item.kind],
      dx = s.x - item.x,
      dz = s.z - item.z,
      distance = Math.hypot(dx, dz),
      reach = g.radius + spec.radius;
    if (distance >= reach) continue;
    if (spec.tier <= g.tier) {
      item.broken = true;
      item.vx = s.dx * 4 + ((item.id % 3) - 1);
      item.vz = s.dz * 4;
      item.vy = 4 + spec.tier;
      item.y = 0.05;
      s.combo++;
      s.comboLeft = 1.5;
      s.score += spec.points * Math.min(4, 1 + Math.floor(s.combo / 5));
      s.mass += spec.mass;
      s.destroyed++;
      s.shake = Math.min(0.3, 0.05 + spec.tier * 0.07);
      const next = growth(s.mass);
      s.event =
        next.tier > g.tier
          ? `${next.name}! 더 큰 것도 밀어!`
          : s.combo >= 5
            ? `${s.combo}연속 와르르!`
            : "와장창!";
      s.eventUntil = s.time + (next.tier > g.tier ? 1.8 : 0.55);
    } else {
      const nx = distance > 0.0001 ? dx / distance : -s.dx,
        nz = distance > 0.0001 ? dz / distance : -s.dz;
      s.x = item.x + nx * (reach + 0.005);
      s.z = item.z + nz * (reach + 0.005);
      if (s.time > s.eventUntil) {
        s.event = "작은 물건부터! 더 커져야 해";
        s.eventUntil = s.time + 0.8;
      }
    }
  }
  const radius = growth(s.mass).radius;
  s.x = Math.max(-ROOM_LIMIT + radius, Math.min(ROOM_LIMIT - radius, s.x));
  s.z = Math.max(-ROOM_LIMIT + radius, Math.min(ROOM_LIMIT - radius, s.z));
}
