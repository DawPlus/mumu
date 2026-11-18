import * as T from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { growth, kinds, type Game, type Item } from "./game";
export class Toy {
  renderer: T.WebGLRenderer;
  private scene = new T.Scene();
  private camera = new T.OrthographicCamera(-10, 10, 10, -10, 0.1, 100);
  private turtle = new T.Group();
  private props = new T.Group();
  private meshes: T.Group[] = [];
  private lastItems: Item[] | null = null;
  constructor(host: HTMLElement) {
    this.renderer = new T.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    this.renderer.setClearColor("#e9edde");
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = T.PCFShadowMap;
    this.renderer.toneMapping = T.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    host.append(this.renderer.domElement);
    this.renderer.domElement.setAttribute("aria-hidden", "true");
    this.camera.position.set(12, 16, 12);
    this.camera.lookAt(0, 0, 0);
    this.scene.add(new T.HemisphereLight("#fff7df", "#8ba78a", 2));
    const sun = new T.DirectionalLight("#fff5de", 2.3);
    sun.position.set(-4, 15, 8);
    sun.castShadow = true;
    sun.shadow.mapSize.set(512, 512);
    Object.assign(sun.shadow.camera, {
      left: -12,
      right: 12,
      top: 12,
      bottom: -12,
    });
    sun.shadow.normalBias = 0.04;
    this.scene.add(sun);
    this.box(this.scene, [0, -0.23, 0], [13.6, 0.4, 13.6], "#ccd1b6");
    for (let x = -6; x <= 6; x += 2)
      for (let z = -6; z <= 6; z += 2)
        this.box(
          this.scene,
          [x, -0.015, z],
          [1.99, 0.02, 1.99],
          ((x + z) / 2) % 2 ? "#f2ebd8" : "#e9e3cf",
        );
    this.box(this.scene, [0, 0.75, -6.7], [13.5, 1.5, 0.2], "#a4b99b");
    this.box(this.scene, [-6.7, 0.75, 0], [0.2, 1.5, 13.5], "#bdcbaa");
    this.scene.add(this.props, this.turtle);
    this.makeTurtle();
  }
  private mat(color: string) {
    return new T.MeshStandardMaterial({ color, roughness: 0.85 });
  }
  private box(parent: T.Object3D, p: number[], size: number[], color: string) {
    const m = new T.Mesh(
      new RoundedBoxGeometry(
        size[0],
        size[1],
        size[2],
        1,
        Math.min(0.05, ...size.map((v) => v / 3)),
      ),
      this.mat(color),
    );
    m.position.set(p[0], p[1], p[2]);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  }
  private ball(parent: T.Object3D, p: number[], size: number[], color: string) {
    const m = new T.Mesh(new T.SphereGeometry(1, 12, 8), this.mat(color));
    m.position.set(p[0], p[1], p[2]);
    m.scale.set(size[0], size[1], size[2]);
    m.castShadow = true;
    parent.add(m);
    return m;
  }
  private makeTurtle() {
    for (const x of [-0.6, 0.6])
      for (const z of [-0.5, 0.5])
        this.ball(this.turtle, [x, 0.15, z], [0.3, 0.17, 0.3], "#bad69b");
    this.ball(this.turtle, [0, 0.42, 0], [0.95, 0.58, 0.86], "#6c9a62");
    this.ball(this.turtle, [0, 0.82, 0], [0.47, 0.24, 0.44], "#91b779");
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      this.ball(
        this.turtle,
        [Math.sin(a) * 0.58, 0.67, Math.cos(a) * 0.52],
        [0.26, 0.17, 0.24],
        "#82ad70",
      );
    }
    this.ball(this.turtle, [0, 0.45, 0.92], [0.43, 0.33, 0.4], "#c5dda2");
    for (const side of [-1, 1]) {
      this.ball(
        this.turtle,
        [side * 0.19, 0.55, 1.24],
        [0.045, 0.07, 0.035],
        "#35483d",
      );
      this.ball(
        this.turtle,
        [side * 0.3, 0.4, 1.18],
        [0.08, 0.04, 0.03],
        "#e9b7a4",
      );
    }
    this.ball(this.turtle, [0, 0.36, 1.28], [0.09, 0.015, 0.015], "#35483d");
  }
  private prop(item: Item) {
    const g = new T.Group(),
      color = kinds[item.kind].color;
    if (item.kind === "can") {
      const m = new T.Mesh(
        new T.CylinderGeometry(0.14, 0.14, 0.4, 10),
        this.mat(item.id % 2 ? "#e8b45e" : color),
      );
      m.position.y = 0.2;
      m.castShadow = true;
      g.add(m);
      this.box(g, [0, 0.2, 0.135], [0.17, 0.13, 0.025], "#fff0ce");
    } else if (item.kind === "box") {
      this.box(g, [0, 0.3, 0], [0.65, 0.6, 0.65], color);
      this.box(g, [0, 0.61, 0], [0.12, 0.025, 0.67], "#f4dfb6");
    } else if (item.kind === "shelf") {
      this.box(g, [0, 0.6, -0.25], [1.3, 1.2, 0.12], color);
      for (const y of [0.15, 0.65, 1.15]) {
        this.box(g, [0, y, 0], [1.4, 0.08, 0.7], "#decda8");
        for (let i = 0; i < 3; i++)
          this.box(
            g,
            [-0.44 + i * 0.44, y + 0.19, 0.05],
            [0.24, 0.3, 0.28],
            ["#e68e69", "#efc467", "#aac092"][i],
          );
      }
    } else {
      this.box(g, [0, 0.85, 0], [1.05, 1.7, 0.9], color);
      this.box(g, [0, 1, 0.46], [1.02, 0.035, 0.025], "#628f95");
      this.box(g, [0.26, 0.65, 0.49], [0.05, 0.45, 0.06], "#fff8e7");
    }
    if (item.kind !== "can") {
      const badge = new T.Group();
      badge.name = "lock";
      badge.position.y =
        item.kind === "fridge" ? 2 : item.kind === "shelf" ? 1.6 : 1;
      this.box(badge, [0, 0, 0], [0.22, 0.22, 0.08], "#f6df9f");
      g.add(badge);
    }
    this.props.add(g);
    return g;
  }
  private clear() {
    this.props.traverse((o) => {
      if (o instanceof T.Mesh) {
        o.geometry.dispose();
        for (const m of Array.isArray(o.material) ? o.material : [o.material])
          m.dispose();
      }
    });
    this.props.clear();
  }
  resize(w: number, h: number) {
    this.renderer.setSize(w, h);
    const span = Math.max(17, (20.3 * h) / w);
    this.camera.left = (-span * w) / h / 2;
    this.camera.right = (span * w) / h / 2;
    this.camera.top = span / 2;
    this.camera.bottom = -span / 2;
    this.camera.updateProjectionMatrix();
  }
  render(s: Game) {
    if (this.lastItems !== s.items) {
      this.lastItems = s.items;
      this.clear();
      this.meshes = s.items.map((item) => this.prop(item));
    }
    const gr = growth(s.mass);
    this.turtle.position.set(
      s.x,
      Math.hypot(s.dx, s.dz) > 0.05
        ? Math.abs(Math.sin(s.time * 15)) * 0.05
        : 0,
      s.z,
    );
    this.turtle.scale.setScalar(gr.radius);
    this.turtle.rotation.y = s.angle;
    s.items.forEach((item, i) => {
      const g = this.meshes[i];
      g.position.set(item.x, item.y, item.z);
      if (item.broken) {
        g.rotation.set(item.spin * 0.7, item.spin * 0.5, item.spin);
        g.scale.setScalar(item.age > 2.5 ? 0.4 : 1);
        g.position.y = item.age > 2.5 ? 0.05 : item.y;
      } else {
        g.rotation.set(0, 0, 0);
        g.scale.setScalar(1);
      }
      const lock = g.getObjectByName("lock");
      if (lock) lock.visible = !item.broken && kinds[item.kind].tier > gr.tier;
    });
    this.renderer.render(this.scene, this.camera);
  }
}
