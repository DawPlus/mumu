const node = (id: string) => document.getElementById(id)!;
const click = (id: string) => node(id).click();
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
function assert(value: unknown, message: string) {
  if (!value) throw new Error(message);
}
async function until(predicate: () => boolean, timeout = 40000) {
  const start = performance.now();
  while (!predicate()) {
    if (performance.now() - start > timeout)
      throw new Error("Timed out waiting for game");
    await delay(20);
  }
}
function pointer(type: string, x: number, y: number) {
  node("scene").dispatchEvent(
    new PointerEvent(type, {
      pointerId: 7,
      pointerType: "touch",
      button: 0,
      bubbles: true,
      clientX: x,
      clientY: y,
    }),
  );
}
export async function checkDrag() {
  click("retry");
  const rect = node("scene").getBoundingClientRect(),
    x = rect.left + rect.width / 2,
    y = rect.top + rect.height / 2;
  const before = { ...node("scene").dataset };
  pointer("pointerdown", x, y);
  pointer("pointermove", x + 45, y - 30);
  await delay(500);
  pointer("pointerup", x + 45, y - 30);
  const after = { ...node("scene").dataset };
  assert(
    before.x !== after.x || before.z !== after.z,
    "drag did not move turtle",
  );
  await delay(200);
  assert(
    node("scene").dataset.x === after.x && node("scene").dataset.z === after.z,
    "release did not stop turtle",
  );
  click("pause");
  const time = node("scene").dataset.remaining;
  await delay(400);
  assert(node("scene").dataset.remaining === time, "timer ran while paused");
  click("resume");
  return "drag → release → pause/resume: PASS";
}
export async function checkRound(mode: "cartoon" | "toy") {
  click(mode);
  await until(() => node(mode).getAttribute("aria-pressed") === "true");
  click("retry");
  const rect = node("scene").getBoundingClientRect(),
    ax = rect.left + rect.width / 2,
    ay = rect.top + rect.height / 2;
  pointer("pointerdown", ax, ay);
  const points: number[][] = [
    [0, 4],
    [-5, 4],
    [5, 4],
    [5, 2],
    [-5, 2],
    [-5, 0],
    [5, 0],
    [5, -2],
    [-5, -2],
    [-5, -4],
    [5, -4],
    [5, -5.6],
    [-5, -5.6],
    [0, 0],
    [3.5, 2.6],
    [-3.5, 2.6],
  ];
  let index = 0,
    lastTarget = performance.now(),
    maxTier = 0;
  await until(() => {
    const state = node("scene").dataset;
    maxTier = Math.max(maxTier, Number(state.tier));
    if (state.status === "finished") return true;
    const target = points[index % points.length],
      dx = target[0] - Number(state.x),
      dz = target[1] - Number(state.z);
    if (Math.hypot(dx, dz) < 0.55 || performance.now() - lastTarget > 2200) {
      index++;
      lastTarget = performance.now();
    }
    const sx = (dx - dz) * 0.707,
      sy = (dx + dz) * 0.485,
      scale = 48 / Math.max(0.1, Math.hypot(sx, sy));
    pointer("pointermove", ax + sx * scale, ay + sy * scale);
    return false;
  }, 45000);
  pointer("pointerup", ax, ay);
  await until(() => !node("overlay").hidden);
  const score = Number(node("scene").dataset.score),
    destroyed = Number(node("scene").dataset.destroyed);
  assert(
    score > 100 && destroyed >= 10,
    `too little destruction: ${score}/${destroyed}`,
  );
  assert(maxTier >= 2, `growth too slow: tier ${maxTier}`);
  assert(node("dialog").textContent?.includes("마트 정리"), "result missing");
  const result = { mode, score, destroyed, maxTier };
  click("again");
  assert(node("scene").dataset.score === "0", "replay score not reset");
  click("pause");
  return result;
}
export async function checkLoadingPause() {
  click("retry");
  click("toy");
  click("help");
  await until(() => node("toy").getAttribute("aria-pressed") === "true");
  const time = node("scene").dataset.remaining;
  await delay(400);
  assert(
    node("scene").dataset.remaining === time,
    "3D load resumed behind help",
  );
  click("begin");
  click("pause");
  return "3D load/help pause: PASS";
}
