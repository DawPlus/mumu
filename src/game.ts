export type Obstacle = { x: number; width: number; type: "hole" | "potato" | "sweetPotato"; hit: boolean };
export interface Game { time: number; distance: number; score: number; speed: number; y: number; vy: number; jumps: number; lives: number; status: "playing" | "finished"; obstacles: Obstacle[]; invulnerable: number; }
export const createGame = (): Game => ({ time: 0, distance: 0, score: 0, speed: 260, y: 0, vy: 0, jumps: 0, lives: 3, status: "playing", obstacles: [], invulnerable: 0 });
export function jump(g: Game) { if (g.status === "playing" && g.jumps < 2) { g.vy = g.jumps ? 390 : 500; g.jumps++; } }
export function step(g: Game, dt: number) {
  if (g.status !== "playing" || !Number.isFinite(dt) || dt <= 0) return;
  dt = Math.min(dt, 0.1); g.time += dt; g.speed = 260 + Math.min(340, g.time * 8); g.distance += g.speed * dt; g.score = Math.floor(g.distance / 10); g.invulnerable = Math.max(0, g.invulnerable - dt);
  if (g.y > 0 || g.vy > 0) { g.y += g.vy * dt; g.vy -= 1200 * dt; if (g.y <= 0) { g.y = 0; g.vy = 0; g.jumps = 0; } }
  const gap = 520 + Math.random() * 380;
  if (!g.obstacles.length || g.obstacles.at(-1)!.x < 700) g.obstacles.push({ x: 1100 + Math.random() * gap, width: 48, type: Math.random() < 0.22 ? "hole" : Math.random() < 0.5 ? "sweetPotato" : "potato", hit: false });
  for (const o of g.obstacles) { o.x -= g.speed * dt; if (!o.hit && o.x < 24 && o.x + o.width > -24) { if (o.type === "hole") { if (g.y < 5 && o.x < 0 && o.x + o.width > 0) g.status = "finished"; } else if (!g.invulnerable && g.y < 55) { o.hit = true; g.lives--; g.invulnerable = 1.1; if (!g.lives) g.status = "finished"; } } }
  g.obstacles = g.obstacles.filter(o => o.x > -80);
}
