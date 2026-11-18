import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createGame,
  step,
  move,
  growth,
  ROUND_SECONDS,
  ROOM_LIMIT,
} from "../src/game.ts";
const advance = (s: ReturnType<typeof createGame>, seconds: number) => {
  for (let t = 0; t < seconds; t += 1 / 120) step(s, 1 / 120);
};
test("a fresh round has 30 seconds, small props and bigger targets", () => {
  const s = createGame();
  assert.equal(s.remaining, 30);
  assert.ok(s.items.some((i) => i.kind === "can"));
  assert.ok(s.items.some((i) => i.kind === "shelf"));
  assert.ok(s.items.some((i) => i.kind === "fridge"));
});
test("drag moves freely and release stops; diagonal input is normalized", () => {
  const a = createGame(),
    b = createGame();
  a.items = [];
  b.items = [];
  a.z = 0;
  b.z = 0;
  move(a, 1, 0);
  move(b, 1, 1);
  advance(a, 1);
  advance(b, 1);
  assert.ok(Math.abs(Math.hypot(a.x, a.z) - Math.hypot(b.x, b.z)) < 0.05);
  move(a, 0, 0);
  const x = a.x;
  advance(a, 0.5);
  assert.equal(a.x, x);
});
test("turtle stays inside the shop", () => {
  const s = createGame();
  s.items = [];
  move(s, 1, 1);
  advance(s, 10);
  assert.ok(Math.abs(s.x) <= ROOM_LIMIT - growth(s.mass).radius);
  assert.ok(Math.abs(s.z) <= ROOM_LIMIT - growth(s.mass).radius);
});
test("small items smash once and add score and growth", () => {
  const s = createGame();
  s.items = s.items.filter((i) => i.kind === "can").slice(0, 1);
  const item = s.items[0];
  item.x = s.x;
  item.z = s.z + 0.1;
  move(s, 0, 1);
  step(s, 0.02);
  assert.equal(item.broken, true);
  assert.ok(s.score > 0);
  assert.ok(s.mass > 0);
  const score = s.score;
  advance(s, 0.1);
  assert.equal(s.score, score);
});
test("a small turtle cannot break a shelf; a grown turtle can", () => {
  const s = createGame();
  s.items = s.items.filter((i) => i.kind === "shelf").slice(0, 1);
  const item = s.items[0];
  item.x = s.x;
  item.z = s.z + 0.2;
  move(s, 0, 1);
  step(s, 0.02);
  assert.equal(item.broken, false);
  assert.equal(s.score, 0);
  s.mass = 150;
  s.x = item.x;
  s.z = item.z - 0.1;
  step(s, 0.02);
  assert.equal(item.broken, true);
});
test("combo rewards consecutive destruction and expires", () => {
  const s = createGame();
  s.items = s.items.filter((i) => i.kind === "can").slice(0, 2);
  s.items.forEach((i, n) => {
    i.x = s.x;
    i.z = s.z + 0.1 + n * 0.1;
  });
  move(s, 0, 1);
  step(s, 0.02);
  assert.ok(s.combo >= 2);
  s.items = [];
  advance(s, 2);
  assert.equal(s.combo, 0);
});
test("growth unlocks boxes then shelves then fridges", () => {
  assert.equal(growth(0).tier, 0);
  assert.equal(growth(40).tier, 1);
  assert.equal(growth(130).tier, 2);
  assert.equal(growth(270).tier, 3);
  assert.ok(growth(270).radius > growth(0).radius);
});
test("round ends at 30 seconds and ignores movement afterwards", () => {
  const s = createGame();
  s.items = [];
  advance(s, ROUND_SECONDS + 0.2);
  assert.equal(s.status, "finished");
  assert.equal(s.remaining, 0);
  const x = s.x;
  move(s, 1, 0);
  advance(s, 1);
  assert.equal(s.x, x);
});
test("new round resets all destruction and score", () => {
  const a = createGame();
  a.items[0].broken = true;
  a.score = 100;
  const b = createGame();
  assert.ok(b.items.every((i) => !i.broken));
  assert.equal(b.score, 0);
});
test("invalid input and delta cannot corrupt coordinates", () => {
  const s = createGame();
  move(s, NaN, Infinity);
  step(s, NaN);
  step(s, -1);
  assert.equal(s.x, 0);
  assert.equal(s.z, 4.8);
});
test("30 seconds stays 30 seconds even at five frames per second", () => {
  const s = createGame();
  s.items = [];
  for (let i = 0; i < 150; i++) step(s, 0.2);
  assert.equal(s.remaining, 0);
  assert.equal(s.status, "finished");
});
