import { growth, kinds, type Game, type Item } from "./game";
const ink = "#35483d";
export class Cartoon {
  canvas = document.createElement("canvas");
  private c: CanvasRenderingContext2D;
  private w = 0;
  private h = 0;
  private scale = 1;
  constructor(host: HTMLElement) {
    this.c = this.canvas.getContext("2d")!;
    host.append(this.canvas);
    this.canvas.setAttribute("aria-hidden", "true");
  }
  resize(w: number, h: number) {
    this.w = w;
    this.h = h;
    this.scale = Math.min(w / 20.3, h / 17);
    const d = Math.min(devicePixelRatio, 2);
    this.canvas.width = w * d;
    this.canvas.height = h * d;
    this.canvas.style.width = w + "px";
    this.canvas.style.height = h + "px";
    this.c.setTransform(d, 0, 0, d, 0, 0);
  }
  private p(x: number, z: number, y = 0): [number, number] {
    return [
      this.w / 2 + (x - z) * 0.707 * this.scale,
      this.h * 0.49 + (x + z) * 0.485 * this.scale - y * 0.728 * this.scale,
    ];
  }
  private poly(points: number[][], color: string, stroke = ink) {
    const c = this.c;
    c.beginPath();
    points.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])));
    c.closePath();
    c.fillStyle = color;
    c.fill();
    if (stroke) {
      c.strokeStyle = stroke;
      c.lineWidth = 1.6;
      c.lineJoin = "round";
      c.stroke();
    }
  }
  private ellipse(
    x: number,
    y: number,
    rx: number,
    ry: number,
    color: string,
    stroke = ink,
  ) {
    const c = this.c;
    c.beginPath();
    c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    c.fillStyle = color;
    c.fill();
    if (stroke) {
      c.strokeStyle = stroke;
      c.lineWidth = 1.5;
      c.stroke();
    }
  }
  private line(points: number[][], color = ink, width = 1.5) {
    const c = this.c;
    c.beginPath();
    points.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])));
    c.strokeStyle = color;
    c.lineWidth = width;
    c.lineCap = "round";
    c.stroke();
  }
  private box(
    x: number,
    z: number,
    w: number,
    d: number,
    h: number,
    color: string,
    y = 0,
  ) {
    const b = this.p(x + w / 2, z - d / 2, y),
      cc = this.p(x + w / 2, z + d / 2, y),
      dd = this.p(x - w / 2, z + d / 2, y),
      top = [
        this.p(x - w / 2, z - d / 2, y + h),
        this.p(x + w / 2, z - d / 2, y + h),
        this.p(x + w / 2, z + d / 2, y + h),
        this.p(x - w / 2, z + d / 2, y + h),
      ];
    this.poly([b, cc, top[2], top[1]], color);
    this.poly([cc, dd, top[3], top[2]], color);
    this.poly(top, color);
  }
  private text(text: string, x: number, y: number, size: number, color = ink) {
    const c = this.c;
    c.font = `800 ${size}px 'Gaegu','Apple SD Gothic Neo',sans-serif`;
    c.textAlign = "center";
    c.fillStyle = color;
    c.fillText(text, x, y);
  }
  private item(item: Item, tier: number) {
    const { x, z, kind, broken, age, y } = item,
      s = this.scale,
      spec = kinds[kind];
    if (broken) {
      const [px, py] = this.p(x, z, y);
      this.c.save();
      this.c.translate(px, py);
      this.c.rotate(item.spin);
      this.c.globalAlpha = Math.max(0.22, 1 - age * 0.22);
      this.poly(
        [
          [-s * 0.25, -s * 0.18],
          [s * 0.2, -s * 0.14],
          [s * 0.25, s * 0.18],
          [-s * 0.1, s * 0.2],
        ],
        spec.color,
      );
      this.c.restore();
      return;
    }
    if (kind === "can") {
      const [px, py] = this.p(x, z, 0.25);
      this.c.fillStyle = item.id % 2 ? "#e8b45e" : "#ea8565";
      this.c.strokeStyle = ink;
      this.c.lineWidth = 1.3;
      this.c.beginPath();
      this.c.roundRect(px - s * 0.13, py - s * 0.23, s * 0.26, s * 0.4, 2);
      this.c.fill();
      this.c.stroke();
      this.ellipse(px, py - s * 0.21, s * 0.13, s * 0.045, "#f6edcf");
      this.line(
        [
          [px - s * 0.09, py],
          [px + s * 0.09, py],
        ],
        "#fff2cf",
        2,
      );
    } else if (kind === "box") {
      this.box(x, z, 0.65, 0.65, 0.62, "#d6aa72");
      this.line(
        [this.p(x, z - 0.32, 0.64), this.p(x, z + 0.32, 0.64)],
        "#f8e7bd",
        s * 0.12,
      );
    } else if (kind === "shelf") {
      this.box(x, z, 1.3, 0.65, 1.05, "#83a89e");
      for (const h of [0.45, 0.95]) {
        this.box(x, z, 1.4, 0.75, 0.09, "#e8d3a7", h);
        for (let i = 0; i < 3; i++)
          this.box(
            x - 0.43 + i * 0.43,
            z + 0.08,
            0.24,
            0.28,
            0.3,
            ["#e68e69", "#efc467", "#aac092"][i],
            h + 0.08,
          );
      }
    } else {
      this.box(x, z, 1.05, 0.9, 1.7, "#acd0d4");
      this.line(
        [this.p(x + 0.16, z + 0.46, 0.3), this.p(x + 0.16, z + 0.46, 1.4)],
        "#f8f8e8",
        s * 0.09,
      );
      this.line(
        [this.p(x - 0.51, z + 0.46, 1.05), this.p(x + 0.51, z + 0.46, 1.05)],
        "#688e8e",
        1.2,
      );
    }
    if (spec.tier > tier) {
      const [px, py] = this.p(
        x,
        z,
        kind === "fridge" ? 2 : kind === "shelf" ? 1.6 : 1,
      );
      this.ellipse(px, py, 7, 7, "#fff8e4");
      this.text(String(spec.tier + 1), px, py + 4, 11, "#8b8d73");
    }
  }
  private turtle(s: Game) {
    const c = this.c,
      scale = this.scale,
      g = growth(s.mass),
      r = g.radius * scale;
    const [px, py] = this.p(s.x, s.z, 0.3);
    const hx = Math.sin(s.angle),
      hz = Math.cos(s.angle),
      head = this.p(s.x + hx * g.radius, s.z + hz * g.radius, 0.55);
    this.ellipse(px, py + r * 0.3, r * 1.1, r * 0.55, "#6b816740", "");
    for (const [dx, dz] of [
      [-0.65, -0.6],
      [0.65, -0.6],
      [-0.65, 0.6],
      [0.65, 0.6],
    ]) {
      const foot = this.p(
        s.x + dx * g.radius,
        s.z + dz * g.radius,
        0.08 + Math.abs(Math.sin(s.time * 16 + dx + dz)) * 0.07,
      );
      this.ellipse(...foot, r * 0.28, r * 0.18, "#bdd497");
    }
    this.ellipse(px, py, r * 0.95, r * 0.7, "#6c9a62");
    this.poly(
      [
        [px, py - r * 0.5],
        [px + r * 0.5, py - r * 0.18],
        [px + r * 0.4, py + r * 0.3],
        [px - r * 0.4, py + r * 0.3],
        [px - r * 0.5, py - r * 0.18],
      ],
      "#91b779",
    );
    this.ellipse(...head, r * 0.48, r * 0.37, "#c5dda2");
    for (const side of [-1, 1]) {
      this.ellipse(
        head[0] + side * r * 0.19,
        head[1] - r * 0.05,
        r * 0.045,
        r * 0.075,
        ink,
        "",
      );
      this.ellipse(
        head[0] + side * r * 0.32,
        head[1] + r * 0.13,
        r * 0.08,
        r * 0.04,
        "#e9b7a4",
        "",
      );
    }
    this.line(
      [
        [head[0] - r * 0.08, head[1] + r * 0.15],
        [head[0], head[1] + r * 0.19],
        [head[0] + r * 0.08, head[1] + r * 0.15],
      ],
      ink,
      1.4,
    );
    if (g.tier === 3) {
      this.poly(
        [
          [px - r * 0.35, py - r * 0.65],
          [px - r * 0.4, py - r * 1.05],
          [px - r * 0.1, py - r * 0.85],
          [px, py - r * 1.15],
          [px + r * 0.15, py - r * 0.85],
          [px + r * 0.4, py - r * 1.05],
          [px + r * 0.35, py - r * 0.65],
        ],
        "#f3ce72",
      );
    }
    c.globalAlpha = 1;
  }
  render(s: Game) {
    const c = this.c;
    c.clearRect(0, 0, this.w, this.h);
    c.fillStyle = "#e9edde";
    c.fillRect(0, 0, this.w, this.h);
    c.save();
    if (s.shake)
      c.translate(
        Math.sin(s.time * 90) * s.shake * 8,
        Math.cos(s.time * 80) * s.shake * 5,
      );
    this.box(0, 0, 13.6, 13.6, 0.18, "#d8dbc2", -0.22);
    for (let x = -6; x <= 6; x += 2)
      for (let z = -6; z <= 6; z += 2)
        this.poly(
          [
            this.p(x - 1, z - 1),
            this.p(x + 1, z - 1),
            this.p(x + 1, z + 1),
            this.p(x - 1, z + 1),
          ],
          ((x + z) / 2) % 2 ? "#f2ebd8" : "#e9e3cf",
          "",
        );
    this.box(0, -6.7, 13.5, 0.2, 1.5, "#a4b99b");
    this.box(-6.7, 0, 0.2, 13.5, 1.5, "#bdcbaa");
    const [sx, sy] = this.p(-1, -6.7, 2.3);
    this.text(
      "거 북 마 트",
      sx,
      sy,
      Math.max(18, this.scale * 0.85),
      "#4e6f51",
    );
    const tier = growth(s.mass).tier;
    const objects = [
      ...s.items.map((item) => ({ depth: item.x + item.z, item })),
      { depth: s.x + s.z, item: null },
    ].sort((a, b) => a.depth - b.depth);
    for (const object of objects)
      if (object.item) this.item(object.item, tier);
      else this.turtle(s);
    c.restore();
  }
}
