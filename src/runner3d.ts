import { drawProp, stickersReady } from "./shopProps";
import { motion } from "./motion";
import * as THREE from "three";
import { isFlying, type Game } from "./game";

export class Runner3D {
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  private renderer: THREE.WebGLRenderer;
  private turtle = new THREE.Group();
  private limbs: THREE.Group[] = [];
  private spin = new THREE.Group();
  private scarf = new THREE.Group();
  private torso = new THREE.Group();
  private props = new Map<Game["obstacles"][number], THREE.Mesh>();
  private propMaterials = new Map<string, THREE.MeshBasicMaterial>();
  private aura = new THREE.Mesh(new THREE.SphereGeometry(1.25,16,12), new THREE.MeshBasicMaterial({color:0xffdf75,transparent:true,opacity:.18,depthWrite:false}));
  private streaks: THREE.Mesh[] = [];
  private quad = new THREE.PlaneGeometry(1, 1);
  constructor(host: HTMLElement) {
    this.scene.background = new THREE.Color("#e8eddc");
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); host.append(this.renderer.domElement);
    this.camera.position.set(0, 5, 13); this.camera.lookAt(0, 1, 0);
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x8a906a, 2));
    const light = new THREE.DirectionalLight(0xffffff, 2); light.position.set(-3, 8, 5); this.scene.add(light);
    const floor = new THREE.Mesh(new THREE.BoxGeometry(30, .25, 5), new THREE.MeshStandardMaterial({ color: "#d4b978" })); floor.position.set(0,-.15,0); this.scene.add(floor);
    const shell = new THREE.Mesh(new THREE.SphereGeometry(.75,20,16),new THREE.MeshStandardMaterial({color:"#dba666"}));shell.scale.set(1.21,.94,1);shell.position.y=.9;this.torso.add(shell);
    const head=new THREE.Mesh(new THREE.SphereGeometry(.48,24,20),new THREE.MeshStandardMaterial({color:"#b0dcbc"}));head.position.set(.9,1.1,0);this.torso.add(head);


    const rim = new THREE.Mesh(new THREE.TorusGeometry(.69,.075,10,48),new THREE.MeshStandardMaterial({color:0xfff2d5,roughness:.8}));
    rim.rotation.x=Math.PI/2;rim.scale.x=1.2;rim.position.y=.66;this.torso.add(rim);
    const muzzle = new THREE.Mesh(new THREE.SphereGeometry(.29,20,16),new THREE.MeshStandardMaterial({color:0xc2e5bd,roughness:.85}));
    muzzle.scale.set(1.2,.7,1);muzzle.position.set(1.2,.99,.08);this.torso.add(muzzle);
    const face=new THREE.Group();
    face.position.set(.76,1.05,.02);
    face.rotation.y=-.55;
    face.add(head,muzzle);
    head.position.set(0,.09,0);head.scale.set(1.14,1.03,1.15);
    muzzle.position.set(.27,-.06,0);
    const bead=(x:number,y:number,z:number,rx:number,ry:number,rz:number,color:number)=>{
      const bead=new THREE.Mesh(new THREE.SphereGeometry(1,18,14),new THREE.MeshStandardMaterial({color,roughness:.65}));
      bead.position.set(x,y,z);bead.scale.set(rx,ry,rz);face.add(bead);
    };
    for(const side of [-1,1]){
      bead(.38,.19,.34*side,.065,.092,.055,0x423435);
      bead(.418,.222,.37*side,.022,.025,.019,0xfff8de);
      bead(.22,.015,.44*side,.091,.041,.035,0xf0ac9c);
    }
    bead(.52,-.08,.14,.043,.049,.095,0x754644);
    this.torso.add(face);
    const tail=new THREE.Mesh(new THREE.SphereGeometry(.2,16,12),head.material);
    tail.scale.set(1.55,.62,.7);tail.position.set(-.81,.63,0);tail.rotation.z=-.28;this.torso.add(tail);
    this.turtle.add(this.torso);
    for(let i=0;i<4;i++) {
      const limb=new THREE.Group();
      const leg=new THREE.Mesh(new THREE.CapsuleGeometry(.12,.3,4,8),new THREE.MeshStandardMaterial({color:0xa8d5b1}));
      leg.position.y=-.18;limb.add(leg);
      const foot=new THREE.Mesh(new THREE.SphereGeometry(.19,12,8),new THREE.MeshStandardMaterial({color:0xb9dfba}));
      foot.scale.set(1.5,.5,1);foot.position.set(.1,-.4,0);limb.add(foot);
      this.limbs.push(limb);this.turtle.add(limb);
    }
    for(let i=0;i<3;i++) {
      const ring=new THREE.Mesh(new THREE.TorusGeometry(.42+i*.07,.025,6,32,4.6),new THREE.MeshStandardMaterial({color:0xe9ae62,transparent:true,opacity:.65-i*.15}));
      ring.rotation.z=i*2;ring.scale.y=.65;this.spin.add(ring);
    }
    this.spin.position.set(0,.3,.65);this.turtle.add(this.spin);
    const honey = new THREE.MeshStandardMaterial({color:0xf2c382,roughness:.88});
    for(const [x,y,z,r] of [[-.06,.99,.72,.29],[-.5,.96,.54,.2],[.39,1.17,.57,.21]]) {
      const plate = new THREE.Mesh(new THREE.CylinderGeometry(r,r*.95,.07,6),honey);
      plate.rotation.x=Math.PI/2; plate.position.set(x,y,z); this.torso.add(plate);
    }
    const coral = new THREE.MeshStandardMaterial({color:0xf27e65,side:THREE.DoubleSide});
    const collar = new THREE.Mesh(new THREE.TorusGeometry(.28,.08,12,32),coral);
    collar.position.set(.65,.92,.06); collar.rotation.y=1.1; this.torso.add(collar);
    const cloth = new THREE.Shape();
    cloth.moveTo(0,0); cloth.quadraticCurveTo(-.34,.24,-.77,.15);
    cloth.lineTo(-.65,.06); cloth.lineTo(-.75,-.02);
    cloth.quadraticCurveTo(-.42,.08,-.04,-.13);
    cloth.closePath(); this.scarf.add(new THREE.Mesh(new THREE.ShapeGeometry(cloth),coral));
    this.scarf.position.set(.57,.98,.43); this.torso.add(this.scarf);
    this.aura.position.y=.8; this.turtle.add(this.aura);
    this.turtle.scale.setScalar(.5);
    this.scene.add(this.turtle);
    const streakGeometry=new THREE.BoxGeometry(1,.025,.035);
    const streakMaterial=new THREE.MeshBasicMaterial({color:0xf5e4b7,transparent:true,opacity:.7});
    for(let i=0;i<28;i++){
      const streak=new THREE.Mesh(streakGeometry,streakMaterial);
      streak.position.set(0,i<18?.015:.6+(i%5)*.45,i<18?1.1+(i%3)*.45:-.8);
      this.streaks.push(streak);this.scene.add(streak);
    }
  }
  resize(w: number, h: number) {
    if (!w || !h) return;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    // Keep enough track ahead of the turtle even on narrow phones.
    const distance = Math.max(13, 13 / this.camera.aspect);
    this.camera.position.set(0, 1 + distance * 4 / 13, distance);
    this.camera.lookAt(0, 1, 0);
    this.camera.updateProjectionMatrix();
  }
  render(g:Game){
    const m=motion(g.speed,g.distance);
    this.aura.visible=isFlying(g) || g.turbo>0;
    for(let i=0;i<this.streaks.length;i++) {
      const streak=this.streaks[i];streak.position.x=((i*1.9-g.distance/100*(i<18?1:1.4))%28+28)%28-14;
      streak.scale.x=(g.speed/600)*(g.turbo>0?1.8:.8);
      streak.visible=i>=18 || !g.obstacles.some(o=>o.type==='hole' && streak.position.x>-2.5+o.x/100 && streak.position.x<-2.5+(o.x+o.width)/100);
    }
    this.aura.scale.setScalar(1+Math.sin(g.time*12)*.06);
    this.scarf.rotation.z=Math.sin(m.phase*1.6)*(.1+m.intensity*.15);
    const crawl = (1 - m.upright) * (g.y > 0 ? 0 : 1);
    this.torso.rotation.z=m.upright*.7-m.lean-.13*crawl;
    this.torso.position.y=m.upright*.18-.17*crawl;
    this.torso.scale.set(1+.09*crawl,1-.09*crawl,1);
    for(let i=0;i<this.limbs.length;i++) {
      const limb=this.limbs[i];
      limb.visible = i >= 2 || m.gait !== 5;
      limb.position.set(i<2?-.4:.55,.45,(i%2?1:-1)*.45);
      if(i>=2)limb.position.set(.55-.05*m.upright,.45+.65*m.upright,(i%2?1:-1)*(.45-.05*m.upright));
      limb.position.x += (i < 2 ? -.16 : .05) * crawl;
      const angle = m.phase + (i < 2 ? i : i + 1) * Math.PI;
      const swing = g.y > 0 ? (i % 2 ? -.8 : .8) : Math.cos(angle);
      const recovery = g.y > 0 ? .65 : Math.max(0, -Math.sin(angle));
      const reach = i >= 2 ? 1 - .35 * m.upright : 1;
      limb.rotation.z = swing * (.5 + m.intensity * .72) * reach;
      limb.position.y += recovery * (.08 + .22 * m.intensity) * (1 - .4*crawl);
      // Keep the paw on the floor through the backward half of a crawl step.
      limb.position.y -= crawl * (1 - recovery) * .4 * (1 - Math.cos(limb.rotation.z));
      limb.children[1].rotation.z = -limb.rotation.z * (1 - recovery) + recovery * .55;
    }
    this.spin.visible=m.gait===5;
    this.spin.scale.set(1.3,.58,1);
    this.spin.children.forEach((arc,i)=>{ arc.rotation.z=m.phase*2+i*2; });
this.turtle.position.y=g.y/100+(g.y>0?0:Math.abs(Math.sin(m.phase))*.08*m.intensity);this.turtle.position.x=-2.5;this.turtle.rotation.z=Math.sin(m.phase)*.06;
    for (const [item, mesh] of this.props) {
      if (!g.obstacles.includes(item)) { this.scene.remove(mesh); this.props.delete(item); }
    }
    for (const item of g.obstacles) {
      const hole = item.type === "hole";
      const platform = item.type === "platform";
      let mesh = this.props.get(item);
      if (!mesh) {
        const materialKey = `${item.type}:${item.width}`;
        let material = this.propMaterials.get(materialKey);
        if (!material) {
          const canvas = document.createElement("canvas");
          canvas.width=item.width*4; canvas.height=320;
          const ctx=canvas.getContext("2d")!;
          ctx.scale(4,4); ctx.translate(0,hole?0:platform?4:72);
          if(item.type==='cactus') {
            for(let x=0;x<item.width;x+=42){ctx.save();ctx.translate(x,0);ctx.scale(Math.min(42,item.width-x)/48,1);drawProp(ctx,item.type);ctx.restore();}
          } else if(hole || platform) drawProp(ctx,item.type,hole,item.width);
          else {ctx.save();ctx.scale(item.width/48,1);drawProp(ctx,item.type);ctx.restore();}
          const map=new THREE.CanvasTexture(canvas); map.colorSpace=THREE.SRGBColorSpace;
          if (item.type === "potato" || item.type === "sweetPotato") void stickersReady.then(ready => {
            if (!ready) return;
            ctx.clearRect(0,-72,48,80);
            drawProp(ctx,item.type);
            map.needsUpdate=true;
          });
          material=new THREE.MeshBasicMaterial({map,transparent:true,alphaTest:.05,side:THREE.DoubleSide});
          this.propMaterials.set(materialKey,material);
        }
        mesh=new THREE.Mesh(this.quad,material);
        mesh.scale.set(item.width/100,hole?4:.8,1);
        if(hole) mesh.rotation.x=-Math.PI/2;
        this.scene.add(mesh); this.props.set(item,mesh);
      }
      mesh.visible=!item.hit;
      mesh.position.set(-2.5+(item.x+item.width/2)/100,hole?.005:(item.y/100+(platform?-.36:.32)),.05);
    }
    this.renderer.render(this.scene,this.camera);
  }
}
