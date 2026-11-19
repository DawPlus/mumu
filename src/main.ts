import "./style.css";
import { createGame, jump, releaseJump, step, isFlying } from "./game";
import { Cartoon } from "./cartoon";
import { Runner3D } from "./runner3d";

document.querySelector<HTMLDivElement>("#app")!.innerHTML=`<main class="game-shell"><header class="topbar"><a class="brand" href="./"><span class="mark">🐢</span><span>거북이 게임 가게</span></a><button id="help" class="icon-btn">?</button></header><section class="title-row"><div><h1>거북이 달려간다!</h1><p>코인을 잇고, 스프링 타고, 터보로 질주!</p></div><span class="edition">끝없는 달리기</span></section><section class="game-board"><div class="board-top"><div class="run-score"><strong id="score">0</strong><span>m</span></div><div id="lives" class="lives">♥ ♥ ♥</div><div class="mode-switch"><button id="cartoon" class="active">카툰</button><button id="toy">3D</button></div></div><div id="scene" class="scene" tabindex="0" aria-label="짧게 누르면 낮게, 길게 누르면 높게 점프합니다"><div id="view" class="view"></div><div id="toy-view" class="view" hidden></div><div class="loot"><span id="coins">● 0</span><span id="pace">1.0×</span></div><div id="notice" class="notice" hidden></div><div id="power" class="power" hidden></div><button id="pause" class="icon-btn pause-btn" aria-label="일시정지">Ⅱ</button><div id="overlay" class="overlay"><div class="dialog"><div class="dialog-turtle">🐢</div><p class="dialog-kicker">한 손으로 즐기는 무한 러너</p><h2 id="dialog-title">거북이, 출발!</h2><p id="instruction">톡 누르면 낮게, 꾹 누르면 높게! 공중에서 한 번 더 점프.</p><button id="begin" class="primary">달리기 시작</button></div></div></div><div class="runner-tip"><b>탭</b><span>톡 = 낮게 · 꾹 = 높게 · 코인 5연속 = 터보</span></div></section><footer><span>최고 기록 <b id="best">0</b>m</span><button id="retry" class="text-button">다시 달리기</button></footer></main>`;

const el = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const scene = el('scene'), cartoon = new Cartoon(el('view')), toyView = el('toy-view');
let toy: Runner3D | undefined, mode: 'cartoon' | 'toy' = 'cartoon';
let game = createGame(), running = false, paused = false, last = performance.now(), best = 0;
let pointer: number | undefined, key: string | undefined;
try { best = Number(localStorage.getItem('turtle-runner-v2-best')) || 0; } catch { /* Private mode. */ }
el('best').textContent = String(best);
function resize() {
  const r = scene.getBoundingClientRect(); cartoon.resize(r.width, r.height); toy?.resize(r.width, r.height); render();
}
new ResizeObserver(resize).observe(scene);
function render() {
  (mode === 'cartoon' ? cartoon : toy)?.render(game);
  el('score').textContent = String(game.score);
  el('lives').textContent = '♥ '.repeat(game.lives).trim();
  el('coins').textContent = `● ${game.coins} · ${game.combo%5}/5`;
  el('pace').textContent = `${(game.speed/420).toFixed(1)}×`;
  el('notice').hidden = !game.noticeTime;
  el('notice').textContent = game.notice;
  scene.classList.toggle('turbo',game.turbo>0);
  el('power').hidden = !isFlying(game) && !game.turbo;
  el('power').textContent = !isFlying(game) ? `⚡ 터보 ${game.turbo.toFixed(1)}초 · 장애물 돌파!` : game.landing ? '안전한 땅으로 착륙 중' : `★ 슈퍼 거북이 ${game.superTime.toFixed(1)}초`;
  Object.assign(scene.dataset, { y: String(game.y), status: game.status, paused: String(paused),
    distance: String(game.distance), speed: String(game.speed), super: String(isFlying(game)) });
}
function syncInputTime() {
  const now = performance.now();
  if (running && !paused) { step(game, (now - last) / 1000); render(); }
  last = now;
}
function clearInput() {
  syncInputTime();
  const captured = pointer; pointer = undefined; key = undefined; releaseJump(game);
  if (captured !== undefined && scene.hasPointerCapture(captured)) scene.releasePointerCapture(captured);
}
function start() {
  clearInput(); game = createGame(); running = true; paused = false;
  el('overlay').hidden = true; last = performance.now(); render();
}
function finish() {
  clearInput(); running = false; best = Math.max(best, game.score);
  try { localStorage.setItem('turtle-runner-v2-best', String(best)); } catch { /* Private mode. */ }
  el('best').textContent = String(best); el('dialog-title').textContent = '잘 달렸어!';
  el('instruction').textContent = `${game.score}m · 코인 ${game.coins}개! 다시 달려볼까?`;
  el('begin').textContent = '다시 달리기'; el('overlay').hidden = false;
}
function pause(help = false) {
  clearInput(); if (running) paused = true;
  el('dialog-title').textContent = help ? '점프를 골라 써봐!' : '잠깐 쉬어가기';
  el('instruction').textContent = '톡 = 낮게, 꾹 = 높게, 공중에서 이단 점프! 분홍 스프링은 자동 도약. 벌 밑은 낮게! 코인 5연속은 3초 터보로 장애물 돌파(구멍 주의). 별은 6초 비행!';
  el('begin').textContent = running ? '계속 달리기' : '달리기 시작';
  el('overlay').hidden = false; render();
}
scene.addEventListener('pointerdown', e => {
  if (!e.isPrimary || e.button !== 0 || !running || paused || pointer !== undefined || key ||
      (e.target as HTMLElement).closest('button, .overlay')) return;
  e.preventDefault(); pointer = e.pointerId; scene.setPointerCapture(pointer); syncInputTime(); jump(game);
});
for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) {
  scene.addEventListener(event, e => { if ((e as PointerEvent).pointerId === pointer) clearInput(); });
}
document.addEventListener('keydown', e => {
  if (!['Space', 'ArrowUp'].includes(e.code) || (e.target instanceof Element && e.target.closest('button, a'))) return;
  e.preventDefault();
  if (!e.repeat && !key && pointer === undefined && running && !paused) { key = e.code; syncInputTime(); jump(game); }
});
document.addEventListener('keyup', e => { if (e.code === key) clearInput(); });
window.addEventListener('blur', () => { if (running && !paused) pause(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && running && !paused) pause(); });
el('begin').onclick = () => {
  if (paused && running) { paused = false; el('overlay').hidden = true; last = performance.now(); }
  else start();
  scene.focus({ preventScroll: true });
};
el('retry').onclick = start; el('help').onclick = () => pause(true); el('pause').onclick = () => pause();
function setMode(next: 'cartoon' | 'toy') {
  clearInput();
  if (next === 'toy' && !toy) {
    try { toy = new Runner3D(toyView); const r = scene.getBoundingClientRect(); toy.resize(r.width, r.height); }
    catch { pause(); el('instruction').textContent = '이 기기에서는 3D를 열 수 없어. 카툰으로 계속 달려줘.'; return; }
  }
  mode = next; el('view').hidden = next !== 'cartoon'; toyView.hidden = next !== 'toy';
  for (const id of ['cartoon', 'toy']) { el(id).classList.toggle('active', id === next); el(id).setAttribute('aria-pressed', String(id === next)); }
  last = performance.now(); render();
}
el('cartoon').onclick = () => setMode('cartoon'); el('toy').onclick = () => setMode('toy');
function frame(now: number) {
  const dt = (now - last) / 1000; last = now;
  if (running && !paused) { step(game, dt); render(); if (game.status === 'finished') finish(); }
  requestAnimationFrame(frame);
}
resize(); requestAnimationFrame(frame);
