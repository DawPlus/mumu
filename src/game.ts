export type PropType = 'hole' | 'potato' | 'sweetPotato' | 'cactus' | 'rock' | 'platform' | 'star' | 'coin' | 'spring' | 'bee';
export type Obstacle = { x: number; width: number; height: number; y: number; type: PropType; hit: boolean };
export interface Game {
  time: number; distance: number; score: number; speed: number; y: number; vy: number;
  jumps: number; lives: number; status: 'playing' | 'finished'; obstacles: Obstacle[];
  invulnerable: number; held: boolean; holdTime: number; grounded: boolean;
  coins: number; combo: number; comboTime: number; turbo: number; bounce: number; notice: string; noticeTime: number;
  superTime: number; landing: boolean; nextPattern: number; pattern: number;
}
export const createGame = (): Game => ({
  time: 0, distance: 0, score: 0, speed: 420, y: 0, vy: 0, jumps: 0, lives: 3,
  status: 'playing', obstacles: [], invulnerable: 0, held: false, holdTime: 0,
  grounded: true, coins: 0, combo: 0, comboTime: 0, turbo: 0, bounce: 0, notice: "", noticeTime: 0, superTime: 0, landing: false, nextPattern: 780, pattern: 0,
});
export const isFlying = (g: Game) => g.superTime > 0 || g.landing;
export function jump(g: Game) {
  if (g.status !== 'playing' || g.held || isFlying(g) || g.jumps >= 2) return;
  g.vy = g.jumps ? 440 : 480;
  g.bounce = 0; g.jumps++; g.held = true; g.holdTime = 0; g.grounded = false;
}
export function releaseJump(g: Game) {
  g.held = false;
  if (!isFlying(g) && !g.bounce && g.vy > 180) g.vy = 180;
}
function announce(g: Game, text: string) { g.notice = text; g.noticeTime = 1.1; }
function addPattern(g: Game) {
  const x = g.nextPattern;
  const add = (type: PropType, offset: number, width = 48, height = 55, y = 0) =>
    g.obstacles.push({ type, x: x + offset, width, height, y, hit: false });
  const coins = (offset: number, heights: number[]) => heights.forEach((y,i)=>add('coin',offset+i*65,28,28,y));
  // Short authored sequences keep gaps readable and leave a recovery runway.
  switch (g.pattern % 9) {
    case 0: coins(-380,[20,20,20,20,20]); add('potato', 100); add('rock', 440, 70, 32); g.nextPattern += 900; break;
    case 1: add('cactus', 0, 170, 64); coins(-40,[100,130,150,130,100]); add('sweetPotato', 490); g.nextPattern += 1050; break;
    case 2:
      add('hole', 0, 820, 0);
      add('platform', 40, 190, 22, 45);
      add('platform', 310, 190, 22, 75);
      add('platform', 590, 190, 22, 45);
      coins(100,[100,120,150,160,140]); g.nextPattern += 1250; break;
    case 3: add('spring', 0, 64, 24); add('hole',140,320,0); coins(80,[100,160,200,210,190]); g.nextPattern += 1000; break;
    case 4: add('bee', 260, 72, 38, 135); add('rock',260,65,24); coins(40,[20,20,20,20,20]); g.nextPattern += 950; break;
    case 5: add('star', 0, 44, 44, 24); coins(300,[165,165,165,165,165]); add('cactus', 420, 220, 64); g.nextPattern += 1050; break;
    case 6: add('hole', 0, 280, 0); add('cactus', 600, 160, 64); g.nextPattern += 1250; break;
    case 7: add('bee',0,72,38,110); coins(20,[20,20,20,20,20]); add('spring',530,64,24); g.nextPattern += 1100; break;
    default: add('rock', 0, 80, 32); add('sweetPotato', 310); add('cactus', 700, 150, 64); g.nextPattern += 1400;
  }
  g.pattern++;
}
function tick(g: Game, dt: number) {
  g.time += dt;
  g.turbo = Math.max(0,g.turbo-dt); g.bounce = Math.max(0,g.bounce-dt);
  g.noticeTime = Math.max(0,g.noticeTime-dt); g.comboTime = Math.max(0,g.comboTime-dt);
  if(!g.comboTime) g.combo=0;
  const targetSpeed = 420 + Math.min(180, g.time * 10) + (g.turbo > 0 ? 100 : 0);
  g.speed += Math.max(-200*dt,Math.min(200*dt,targetSpeed-g.speed));
  const travel = g.speed * dt;
  g.distance += travel; g.score = Math.floor(g.distance / 10);
  g.invulnerable = Math.max(0, g.invulnerable - dt);
  g.nextPattern -= travel;
  while (g.nextPattern < 1700) addPattern(g);
  for (const o of g.obstacles) o.x -= travel;
  const overHole = g.obstacles.some(o => o.type === 'hole' && o.x < 12 && o.x + o.width > -12);
  const previousY = g.y;
  if (isFlying(g)) {
    g.superTime = Math.max(0, g.superTime - dt);
    g.landing = g.superTime === 0;
    // Reserve enough ground for the whole descent, including possible turbo acceleration.
    // Hazards cannot hurt during flight; they must not keep cancelling the landing.
    const runway = Math.min(700, g.speed + 100) * (g.y / 330) + 30;
    const safeRunway = !g.obstacles.some(o => o.type === 'hole' &&
      o.x < runway && o.x + o.width > -30);
    const descending = g.landing && g.vy < 0;
    const target = g.landing && (descending || safeRunway) ? 0 : 155;
    g.y += Math.max(-330 * dt, Math.min(330 * dt, target - g.y));
    g.vy = target === 0 ? -330 : 0; g.held = false;
    if (g.landing && g.y === 0) {
      g.landing = false; g.vy = 0; g.grounded = true; g.jumps = 0; g.invulnerable = 1;
    }
  } else {
    g.holdTime += dt;
    const gravity = g.held && g.holdTime < .3 && g.vy > 0 ? 500 : 1450;
    g.vy -= gravity * dt; g.y += g.vy * dt;
    let surface = overHole ? -Infinity : 0;
    for (const o of g.obstacles) {
      if (o.type === 'platform' && o.x < 18 && o.x + o.width > -18 &&
          previousY >= o.y - 1 && g.y <= o.y && g.vy <= 0) surface = Math.max(surface, o.y);
    }
    if (g.vy <= 0 && g.y <= surface && previousY >= surface - 1) {
      g.y = surface; g.vy = 0; g.jumps = 0; g.grounded = true;
    } else {
      if (g.grounded) g.jumps = Math.max(1, g.jumps);
      g.grounded = false;
    }
    if (g.y < -110) g.status = 'finished';
  }
  for (const o of g.obstacles) {
    if (o.hit || o.x >= 20 || o.x + o.width <= -20) continue;
    if (o.type === 'hole' || o.type === 'platform') continue;
    if (g.y >= o.y + o.height || g.y + 62 <= o.y) continue;
    if (o.type === 'coin') {
      o.hit = true; g.coins++; g.combo++; g.comboTime=1.5;
      if(g.combo%5===0){g.turbo=3;announce(g,'코인 5연속! 터보!!');}
    } else if(o.type==='spring') {
      if(!isFlying(g) && g.vy<=0){o.hit=true;g.vy=850;g.jumps=1;g.held=false;g.grounded=false;g.bounce=1.3;announce(g,'뿌우웅! 스프링 점프');}
    } else if (o.type === 'star') {
      announce(g,'슈퍼 거북이 출동!'); o.hit = true; g.superTime = 6; g.landing = false; g.held = false; g.grounded = false;
    } else if (isFlying(g) || g.turbo > 0) {
      o.hit = true;
    } else if (!g.invulnerable) {
      o.hit = true; g.lives--; g.invulnerable = 1.1; g.combo=0; g.comboTime=0; announce(g,'앗 따가!');
      if (!g.lives) g.status = 'finished';
    }
  }
  g.obstacles = g.obstacles.filter(o => o.x + o.width > -180);
}
export function step(g: Game, dt: number) {
  if (g.status !== 'playing' || !Number.isFinite(dt) || dt <= 0) return;
  // Substeps prevent tunnelling through narrow platforms at high speed.
  let remaining = Math.min(dt, .25);
  while (remaining > 1e-8 && g.status === 'playing') {
    const delta = Math.min(remaining, 1 / 120); tick(g, delta); remaining -= delta;
  }
}
