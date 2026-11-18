import "./style.css";
import { createGame, growth, move, step, type Game } from "./game";
import { Cartoon } from "./cartoon";
import type { Toy } from "./toy";
const icons = {
  sound:
    '<path d="M11 5 6 9H3v6h3l5 4V5Zm4 3a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
  mute: '<path d="M11 5 6 9H3v6h3l5 4V5Zm5 4 5 6m0-6-5 6"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  retry: '<path d="M4 10a8 8 0 1 1 1 8M4 4v6h6"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 0 1 6 0c0 2-3 2-3 5m0 3h.01"/>',
  arrow: '<path d="m9 5 7 7-7 7"/>',
  hand: '<path d="M8 12V5a2 2 0 0 1 4 0v6-2a2 2 0 0 1 4 0v3-1a2 2 0 0 1 4 0v4c0 5-3 7-7 7-3 0-5-2-6-4l-3-5a2 2 0 0 1 3-2l1 1Z"/>',
};
function icon(key: keyof typeof icons) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[key]}</svg>`;
}

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
<main class="game-shell">
<header class="topbar"><a class="brand" href="./"><svg class="mark" viewBox="0 0 46 35" aria-hidden="true"><path d="M9 26 5 30m24-4 4 4M7 17 2 16"/><ellipse cx="20" cy="19" rx="14" ry="11" fill="#95b77e"/><path d="m11 13 8-3 8 5-2 9-10 2-5-7 1-6m8-3 1 9 5 5m-5-5-10 0"/><ellipse cx="37" cy="16" rx="7" ry="6" fill="#bad89b"/><circle cx="40" cy="14" r="1" fill="currentColor" stroke="none"/></svg><span>느긋한 게임 가게</span></a><div class="toolbar"><button id="sound" class="icon-btn" aria-label="소리 켜기" aria-pressed="false">${icon("mute")}</button><button id="help" class="icon-btn" aria-label="게임 방법">${icon("help")}</button></div></header>
<section class="title-row"><div><h1>거북이, 사고쳤다!</h1><p>30초만 눈 감아주세요. 마트는 제가 치울게요(?)</p></div><span class="edition">와장창 마트</span></section>
<section class="game-board" aria-label="거북이 마트 파괴 게임">
<div class="board-top"><div class="run-score"><strong id="score">0</strong><span>점</span></div><div class="timer" aria-label="남은 시간"><b id="time">30</b><span>초</span></div><div class="mode-switch" role="group" aria-label="그래픽 모드"><button id="cartoon" class="active" aria-pressed="true">카툰</button><button id="toy" aria-pressed="false">3D</button></div></div>
<div id="scene" class="scene" tabindex="0" aria-label="마트. 손가락을 누른 채 움직이면 거북이가 이동합니다. 키보드는 방향키 또는 WASD."><div id="cartoon-view" class="view"></div><div id="toy-view" class="view" hidden></div><div class="scene-note"><span class="live-dot"></span><span id="scene-note">작은 캔부터 툭툭 밀어봐!</span></div><div id="bubble" class="bubble" hidden></div><div class="scene-bottom"><span id="combo" class="zone-label">오늘도 평화로운 마트…?</span><button id="pause" class="icon-btn" aria-label="일시정지">${icon("pause")}</button></div><div id="joystick" class="joystick" hidden><div id="stick"></div></div></div>
<div class="growth-panel"><div class="growth-heading"><strong id="growth-name">꼬마 거북이</strong><span id="next-unlock">상자까지 40</span></div><div class="growth-track" role="progressbar" aria-label="거북이 성장" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><div id="growth-fill"></div></div><div class="unlock-list"><span data-tier="0">캔</span><span data-tier="1">상자</span><span data-tier="2">진열대</span><span data-tier="3">냉장고</span></div></div>
<div class="drag-tip">${icon("hand")}<span><b>꾹 누르고 움직여!</b><small>놓으면 정지 · 연속으로 부수면 최대 4배 점수</small></span><span class="key-hint">↑ ← ↓ →</span></div>
<div id="overlay" class="overlay"><div id="dialog" class="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title"></div></div>
</section><footer><span>최고 기록 <b id="best">0</b>점</span><button id="retry" class="text-button">${icon("retry")}다시 한 판</button></footer>
</main>`;
function el<T extends HTMLElement = HTMLElement>(id: string) {
  return document.getElementById(id) as T;
}
const cartoon = new Cartoon(el("cartoon-view"));
let toy: Toy | undefined;
let mode: "cartoon" | "toy" = "cartoon";
let loadingToy = false;
let game: Game = createGame();
let running = false,
  paused = false,
  resultShown = false,
  sound = false,
  best = 0;
let audio: AudioContext | undefined;
let activePointer: number | null = null;
let anchor = { x: 0, y: 0 };
const keys = new Set<string>();
try {
  const value = Number(localStorage.getItem("turtle-mart-best"));
  if (Number.isSafeInteger(value) && value >= 0) best = value;
} catch {
  /* Private browsing can disable storage. */
}
function beep(freq: number, duration = 0.12, type: OscillatorType = "sine") {
  if (!sound) return;
  try {
    audio ??= new AudioContext();
    void audio.resume();
    const osc = audio.createOscillator(),
      gain = audio.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audio.currentTime);
    osc.frequency.exponentialRampToValueAtTime(
      freq * 0.6,
      audio.currentTime + duration,
    );
    gain.gain.setValueAtTime(0.045, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duration);
    osc.connect(gain);
    gain.connect(audio.destination);
    osc.start();
    osc.stop(audio.currentTime + duration);
  } catch {
    /* Silent play remains available without Web Audio. */
  }
}

function resize() {
  const rect = el("scene").getBoundingClientRect();
  cartoon.resize(rect.width, rect.height);
  toy?.resize(rect.width, rect.height);
  stopInput();
  render();
}
new ResizeObserver(resize).observe(el("scene"));
function render() {
  if (mode === "cartoon") cartoon.render(game);
  else toy?.render(game);
  const g = growth(game.mass),
    fraction = g.tier === 3 ? 1 : (game.mass - g.base) / (g.next - g.base);
  el("score").textContent = game.score.toLocaleString("ko-KR");
  el("time").textContent = String(Math.ceil(game.remaining));
  el("time").parentElement!.classList.toggle("urgent", game.remaining <= 10);
  el("best").textContent = String(best);
  el("growth-name").textContent = g.name;
  el("scene-note").textContent = [
    "작은 캔부터 툭툭 밀어봐!",
    "상자도 이제 와장창!",
    "진열대까지 밀어버려!",
    "냉장고도 문제없지! 전부 와장창!",
  ][g.tier];
  el("next-unlock").textContent =
    g.tier === 3
      ? "이제 전부 밀어버려!"
      : `${["상자", "진열대", "냉장고"][g.tier]}까지 ${g.next - game.mass}`;
  el("growth-fill").style.width = `${fraction * 100}%`;
  el("growth-fill").parentElement!.setAttribute(
    "aria-valuenow",
    String(Math.round(fraction * 100)),
  );
  document
    .querySelectorAll<HTMLElement>("[data-tier]")
    .forEach((n) =>
      n.classList.toggle("unlocked", Number(n.dataset.tier) <= g.tier),
    );
  el("bubble").hidden = game.time > game.eventUntil;
  el("bubble").textContent = game.event;
  el("combo").textContent =
    game.combo >= 2
      ? `${game.combo}연속 와르르! ×${Math.min(4, 1 + Math.floor(game.combo / 5))}`
      : `${game.destroyed}개 와장창!`;
  const state = el("scene").dataset;
  state.status = game.status;
  state.x = game.x.toFixed(3);
  state.z = game.z.toFixed(3);
  state.score = String(game.score);
  state.tier = String(g.tier);
  state.remaining = game.remaining.toFixed(3);
  state.destroyed = String(game.destroyed);
}
function stopInput() {
  activePointer = null;
  keys.clear();
  move(game, 0, 0);
  el("joystick").hidden = true;
}
function showDialog(html: string) {
  stopInput();
  el("dialog").innerHTML = html;
  el("overlay").hidden = false;
  el("dialog").querySelector<HTMLButtonElement>("button")?.focus();
}
function hideDialog() {
  el("overlay").hidden = true;
  el("scene").focus({ preventScroll: true });
}
function start() {
  last = performance.now();
  stopInput();
  game = createGame();
  running = true;
  paused = false;
  resultShown = false;
  hideDialog();
  render();
}
function resume() {
  last = performance.now();
  if (game.status === "finished") result();
  else {
    paused = false;
    hideDialog();
  }
}
function tutorial() {
  paused = true;
  showDialog(
    `<div class="dialog-turtle" aria-hidden="true">🐢</div><p class="dialog-kicker">마트가 왜 이렇게 조용하지?</p><h2 id="dialog-title">한바탕 어질러볼까?</h2><p>손가락을 꾹 누르고 움직여요.<br>작은 물건부터 밀면 거북이가 커져요!</p><div class="how-to"><div><b>슥슥</b><span>캔 → 상자 → 진열대 → 냉장고</span></div><div><b>와장창</b><span>연속 파괴로 콤보 점수 쌓기</span></div></div><p class="small-note">제한 시간 30초. 얼마나 어지를 수 있을까?</p><button id="begin" class="primary">${running ? "이어서 어지르기" : "좋아, 사고 치자!"} ${icon("arrow")}</button>`,
  );
  el("begin").onclick = () => (running ? resume() : start());
}
function pause() {
  if (!running || game.status === "finished") return;
  paused = true;
  showDialog(
    `<div class="dialog-turtle" aria-hidden="true">🐢</div><h2 id="dialog-title">아무 일도 없었어요.</h2><p>잠깐 쉬는 동안 시간도 멈춰요.</p><button id="resume" class="primary">이어서 어지르기 ${icon("arrow")}</button><button id="restart" class="secondary">새로 시작하기</button>`,
  );
  el("resume").onclick = resume;
  el("restart").onclick = start;
}
function result() {
  resultShown = true;
  stopInput();
  best = Math.max(best, game.score);
  try {
    localStorage.setItem("turtle-mart-best", String(best));
  } catch {
    /* Scores work without persistent storage. */
  }
  render();
  const rank = growth(game.mass).name;
  showDialog(
    `<div class="dialog-turtle" aria-hidden="true">🐢</div><p class="dialog-kicker">범인은… 거북이였습니다.</p><h2 id="dialog-title">마트 정리(?) 끝!</h2><div class="result-score">${game.score.toLocaleString("ko-KR")}<small>점</small></div><p><b>${rank}</b> · ${game.destroyed}개 와장창!<br>${game.destroyed < 8 ? "작은 캔이 모인 곳을 쓸어보세요." : "다음엔 더 큰 것도 밀어보자!"}</p><button id="again" class="primary">한 판만 더! ${icon("arrow")}</button>`,
  );
  el("again").onclick = start;
}
function canMove() {
  return (
    running &&
    !paused &&
    !loadingToy &&
    game.status === "playing" &&
    el("overlay").hidden
  );
}
function steer(dx: number, dy: number) {
  const length = Math.max(1, Math.hypot(dx, dy));
  dx /= length;
  dy /= length;
  move(game, dx / 0.707 / 2 + dy / 0.485 / 2, -dx / 0.707 / 2 + dy / 0.485 / 2);
}
const scene = el("scene");
scene.addEventListener("pointerdown", (event) => {
  if (
    !canMove() ||
    event.button !== 0 ||
    activePointer !== null ||
    (event.target as HTMLElement).closest("#pause")
  )
    return;
  event.preventDefault();
  keys.clear();
  activePointer = event.pointerId;
  anchor = { x: event.clientX, y: event.clientY };
  try {
    scene.setPointerCapture(event.pointerId);
  } catch {
    /* Synthetic/accessibility pointers may not support capture. */
  }
  const rect = scene.getBoundingClientRect();
  el("joystick").hidden = false;
  el("joystick").style.left = `${anchor.x - rect.left}px`;
  el("joystick").style.top = `${anchor.y - rect.top}px`;
  el("stick").style.transform = "translate(0,0)";
});
scene.addEventListener("pointermove", (event) => {
  if (event.pointerId !== activePointer || !canMove()) return;
  event.preventDefault();
  const dx = (event.clientX - anchor.x) / 48,
    dy = (event.clientY - anchor.y) / 48;
  steer(dx, dy);
  const length = Math.max(1, Math.hypot(dx, dy));
  el("stick").style.transform =
    `translate(${(dx / length) * 23}px,${(dy / length) * 23}px)`;
});
for (const event of ["pointerup", "pointercancel", "lostpointercapture"])
  scene.addEventListener(event, (e) => {
    if ((e as PointerEvent).pointerId === activePointer) stopInput();
  });
function keyboardMove() {
  if (!canMove()) return;
  steer(
    Number(keys.has("ArrowRight") || keys.has("d")) -
      Number(keys.has("ArrowLeft") || keys.has("a")),
    Number(keys.has("ArrowDown") || keys.has("s")) -
      Number(keys.has("ArrowUp") || keys.has("w")),
  );
}
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && running) {
    if (paused) resume();
    else pause();
    return;
  }
  if (
    [
      "ArrowUp",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
      "w",
      "a",
      "s",
      "d",
    ].includes(event.key) &&
    canMove()
  ) {
    event.preventDefault();
    keys.add(event.key);
    keyboardMove();
  }
});
document.addEventListener("keyup", (event) => {
  if (!keys.has(event.key)) return;
  keys.delete(event.key);
  keyboardMove();
});
window.addEventListener("blur", () => {
  stopInput();
  if (running && !paused) pause();
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden && running && !paused) pause();
});
el("pause").onclick = pause;
el("retry").onclick = start;
el("help").onclick = tutorial;
el("sound").onclick = () => {
  sound = !sound;
  el("sound").innerHTML = icon(sound ? "sound" : "mute");
  el("sound").setAttribute("aria-pressed", String(sound));
  el("sound").setAttribute("aria-label", sound ? "소리 끄기" : "소리 켜기");
  beep(500);
};
async function setMode(next: "cartoon" | "toy") {
  if (loadingToy) return;
  stopInput();
  if (next === "toy" && !toy) {
    loadingToy = true;
    el("toy").textContent = "로딩…";
    try {
      const { Toy } = await import("./toy");
      toy = new Toy(el("toy-view"));
      const rect = scene.getBoundingClientRect();
      toy.resize(rect.width, rect.height);
    } catch {
      el("scene-note").textContent = "이 기기에서는 카툰 모드로 즐겨주세요.";
      return;
    } finally {
      last = performance.now();
      loadingToy = false;
      el("toy").textContent = "3D";
    }
  }
  mode = next;
  el("cartoon-view").hidden = next !== "cartoon";
  el("toy-view").hidden = next !== "toy";
  for (const key of ["cartoon", "toy"]) {
    el(key).classList.toggle("active", key === mode);
    el(key).setAttribute("aria-pressed", String(key === mode));
  }
  render();
}
el("cartoon").onclick = () => void setMode("cartoon");
el("toy").onclick = () => void setMode("toy");
document.addEventListener("keydown", (event) => {
  if (event.key !== "Tab" || el("overlay").hidden) return;
  const buttons = [
      ...el("dialog").querySelectorAll<HTMLButtonElement>("button"),
    ],
    first = buttons[0],
    last = buttons.at(-1);
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last?.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first?.focus();
  }
});
let last = performance.now();
function frame(now: number) {
  const dt = (now - last) / 1000;
  last = now;
  if (running && !paused && !loadingToy && game.status === "playing") {
    const before = game.destroyed;
    step(game, dt);
    if (game.destroyed > before) beep(180 + game.combo * 25, 0.07, "triangle");
    render();
  }
  if (running && !resultShown && game.status === "finished") result();
  requestAnimationFrame(frame);
}
resize();
tutorial();
requestAnimationFrame(frame);
