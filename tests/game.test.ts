import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, jump, releaseJump, step, isFlying, type Game, type Obstacle } from '../src/game.ts';
import { motion } from '../src/motion.ts';
const advance = (g: Game, seconds: number) => { for (let t = 0; t < seconds - 1e-8; t += 1 / 120) step(g, Math.min(1 / 120, seconds - t)); };
const empty = () => { const g = createGame(); g.nextPattern = 1e6; return g; };
const prop = (type: Obstacle['type'], x: number, width = 48, y = 0, height = 55): Obstacle => ({ type, x, width, y, height, hit: false });
test('starts running and accelerates into sonic with a speed cap', () => {
  const g = empty(); assert.equal(motion(g.speed, 0).gait, 4);
  advance(g, 16.1); assert.equal(motion(g.speed, 0).gait, 5);
  advance(g, 20); assert.equal(g.speed, 600);
});
test('jump is immediate; holding reaches more than twice tap height', () => {
  function peak(held: boolean) {
    const g = empty(); jump(g); assert.ok(g.vy > 0);
    if (!held) releaseJump(g);
    let peak = 0;
    for (let i = 0; i < 180; i++) { step(g, 1 / 120); peak = Math.max(peak, g.y); }
    return peak;
  }
  assert.ok(peak(true) > peak(false) * 2);
});
test('one press never auto-bounces; second press allows exactly one air jump', () => {
  const g = empty(); jump(g); const first = g.vy; jump(g); assert.equal(g.vy, first);
  advance(g, .1); releaseJump(g); jump(g); assert.equal(g.jumps, 2);
  releaseJump(g); const before = g.vy; jump(g); assert.equal(g.vy, before);
  advance(g, 2); assert.equal(g.y, 0); assert.equal(g.jumps, 0);
  advance(g, .5); assert.equal(g.y, 0);
});
test('descending turtle lands on a platform over a pit and recharges jump', () => {
  const g = empty(); g.y = 80; g.vy = -150; g.jumps = 2; g.grounded = false;
  g.obstacles = [prop('hole', -500, 1500, 0, 0), prop('platform', -80, 300, 45, 22)];
  advance(g, .15); assert.equal(g.y, 45); assert.equal(g.jumps, 0); assert.ok(g.grounded);
  jump(g); assert.ok(g.vy > 0);
});
test('platform undersides do not catch an ascending turtle', () => {
  const g = empty(); g.obstacles = [prop('platform', -100, 500, 45, 22)]; jump(g); advance(g, .15);
  assert.ok(g.y > 45); assert.ok(g.vy > 0);
});
test('falling into a hole ends the run; walking off cannot grant two air jumps', () => {
  const g = empty(); g.obstacles = [prop('hole', -100, 1000, 0, 0)];
  advance(g, .03); assert.equal(g.jumps, 1);
  advance(g, .7); assert.equal(g.status, 'finished');
});
test('hazards cost one life and invulnerability prevents repeated damage', () => {
  const g = empty(); g.obstacles = [prop('cactus', -5, 170, 0, 64), prop('rock', 10)];
  advance(g, .15); assert.equal(g.lives, 2);
});
test('star grants six seconds of invulnerable flight and safe landing', () => {
  const g = empty(); g.obstacles = [prop('star', 0, 44, 24, 44), prop('cactus', 5, 170, 0, 64)];
  step(g, 1 / 120); assert.ok(isFlying(g)); assert.equal(g.lives, 3);
  advance(g, 1); assert.equal(g.y, 155);
  advance(g, 6); assert.equal(g.y, 0); assert.equal(isFlying(g), false); assert.equal(g.status, 'playing');
});
test('expired flight waits for a safe runway beyond a pit', () => {
  const g = empty(); g.superTime = .02; g.y = 155;
  g.obstacles = [prop('hole', -100, 1000, 0, 0)];
  advance(g, 1); assert.ok(g.landing); assert.equal(g.y, 155);
  advance(g, 2); assert.equal(g.y, 0); assert.ok(!isFlying(g)); assert.equal(g.status, 'playing');
});
test('long pits remain alive until their trailing edge passes', () => {
  const g = empty(); g.superTime = 6; g.obstacles = [prop('hole', -300, 1000, 0, 0)];
  step(g, .1); assert.equal(g.obstacles.length, 1);
});
test('authored course includes varied hazards, landing platforms and stars', () => {
  const g = createGame(); const types = new Set<string>();
  for(let i=0;i<3600;i++) { g.superTime = 1; step(g, 1 / 120); for(const o of g.obstacles) types.add(o.type); }
  for(const type of ['potato','sweetPotato','rock','cactus','hole','platform','star']) assert.ok(types.has(type), type);
});
test('invalid time and finished rounds do not advance', () => {
  const g = empty(); for(const dt of [-1,0,NaN,Infinity]) step(g,dt);
  assert.equal(g.time,0); g.status='finished'; step(g,1); assert.equal(g.time,0);
});
test('platform-only section is traversable at both initial and maximum speed', () => {
  for(const time of [0,24,30]) {
    const g=empty(); g.time=time; g.speed=time ? 600 : 420; if(time===30){g.speed=700;g.turbo=3;}
    g.obstacles=[prop('hole',120,820,0,0),prop('platform',160,190,45,22),prop('platform',430,190,75,22),prop('platform',710,190,45,22)];
    let landed=false;
    for(let i=0;i<450 && g.status==='playing';i++) {
      const nearEdge = g.y === 0 || g.obstacles.some(o=>o.type==='platform' && o.y===g.y && o.x<0 && o.x+o.width<10);
      if(g.grounded && nearEdge && g.obstacles.some(o=>o.type==='hole' && o.x<125 && o.x+o.width>0)) { releaseJump(g); jump(g); }
      if(g.holdTime>=.3) releaseJump(g);
      step(g,1/120);
      if(g.grounded && g.y>0)landed=true;
    }
    assert.ok(landed, `no platform landing at time ${time}`);
    assert.equal(g.status,'playing', `unreachable at time ${time}`); assert.equal(g.y,0);
  }
});
test('five consecutive coins trigger smooth turbo and expire', () => {
  const g=empty();g.obstacles=Array.from({length:5},(_,i)=>prop('coin',i*65,28,20,28));
  advance(g,.8);assert.equal(g.coins,5);assert.ok(g.turbo>0);assert.ok(g.speed>440);
  advance(g,4);assert.equal(g.turbo,0);assert.equal(g.combo,0);assert.ok(g.speed<500);
});
test('missed coin timing breaks combo; one coin cannot count twice', () => {
  const g=empty();g.obstacles=[prop('coin',0,28,20,28)];advance(g,.2);assert.equal(g.coins,1);
  advance(g,1.6);assert.equal(g.combo,0);assert.equal(g.turbo,0);
});
test('spring launches without input and releasing cannot cut the automatic bounce', () => {
  const g=empty();g.obstacles=[prop('spring',0,64,0,24)];step(g,1/120);
  assert.ok(g.vy>=800);assert.equal(g.jumps,1);releaseJump(g);assert.ok(g.vy>=800);
  advance(g,.3);assert.ok(g.y>180);jump(g);assert.equal(g.jumps,2);
});
test('spring clears its associated pit without requiring another press', () => {
  for(const speed of [420,600,700]) {
    const g=empty();g.time=speed===420?0:24;g.speed=speed;g.turbo=speed===700?3:0;
    g.obstacles=[prop('spring',0,64,0,24),prop('hole',140,320,0,0)];
    advance(g,2);assert.equal(g.status,'playing');assert.equal(g.y,0);
  }
});
test('ground route passes below bees while a high jump hits them', () => {
  const ground=empty();ground.obstacles=[prop('bee',0,72,110,38)];advance(ground,.1);assert.equal(ground.lives,3);
  const air=empty();air.y=100;air.grounded=false;air.obstacles=[prop('bee',0,72,110,38)];step(air,1/120);assert.equal(air.lives,2);
});
test('turbo breaks hazards but does not protect from falling into pits', () => {
  const g=empty();g.turbo=3;g.obstacles=[prop('cactus',0,170,0,64)];advance(g,.2);assert.equal(g.lives,3);assert.ok(g.obstacles[0].hit);
  g.obstacles=[prop('hole',-100,1000,0,0)];advance(g,1);assert.equal(g.status,'finished');
});
test('expired super lands among ground hazards instead of waiting forever', () => {
  const g=empty();g.time=18;g.speed=600;g.superTime=.01;g.y=155;
  g.obstacles=Array.from({length:12},(_,i)=>prop('cactus',i*250,170,0,64));
  advance(g,.65);
  assert.equal(isFlying(g),false);assert.equal(g.y,0);assert.equal(g.lives,3);
});
test('real star course completes landing without repeatedly ascending', () => {
  const g=createGame();g.time=18;g.speed=600;g.pattern=5;g.nextPattern=0;
  let descending=false,landed=false;
  for(let i=0;i<960;i++){
    const y=g.y;step(g,1/120);
    if(g.superTime===0 && i>120){
      if(g.y<y)descending=true;
      if(descending)assert.ok(g.y<=y,'landing reversed into ascent');
      if(!isFlying(g)){landed=true;break;}
    }
  }
  assert.ok(landed,'still flying more than two seconds after expiry');
});
