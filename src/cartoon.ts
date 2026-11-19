import bodyUrl from "./turtle-body.png";
import crawlUrl from "./turtle-crawl.png";
import { drawProp } from "./shopProps";
import { motion, gaitNames } from "./motion";
import type { Game } from "./game";

export class Cartoon {
  canvas = document.createElement("canvas");
  private c = this.canvas.getContext("2d")!;
  private w = 0;
  private h = 0;
  private body = new Image();
  private crawlBody = new Image();
  private lastFrame?: Game;
  constructor(host: HTMLElement) {
    host.append(this.canvas);
    this.body.onload = () => { if (this.lastFrame) this.render(this.lastFrame); };
    this.body.src = bodyUrl;
    this.crawlBody.onload = this.body.onload;
    this.crawlBody.src = crawlUrl;
  }
  resize(w: number, h: number) { this.w = w; this.h = h; const d = Math.min(devicePixelRatio, 2); this.canvas.width = w*d; this.canvas.height = h*d; this.canvas.style.width = `${w}px`; this.canvas.style.height = `${h}px`; this.c.setTransform(d,0,0,d,0,0); }
  render(g: Game) {
    this.lastFrame = g;
    const c=this.c,w=this.w,h=this.h,ground=h*.76,scale=Math.min(w / (w < 540 ? 760 : 900), h / 400), turtleX=w*.18;
    c.clearRect(0,0,w,h); c.fillStyle="#e8eddc"; c.fillRect(0,0,w,h);
    c.fillStyle="#d9e2c9"; for(let i=0;i<5;i++){const x=((i*230-g.distance*.18)%(w+120)+(w+120))%(w+120)-50;c.beginPath();c.arc(x,h*.48,65,0,Math.PI*2);c.fill();}
    c.fillStyle="#d4b978";c.fillRect(0,ground,w,h-ground);c.fillStyle="#b39c63";c.fillRect(0,ground,w,5);
    for (const item of g.obstacles) {
      c.save(); c.translate(turtleX + item.x * scale, ground); c.scale(scale, scale);
      drawProp(c, item.type);
      if (item.type === "hole") { c.fillStyle="#796352"; c.fillRect(0,80,item.width,Math.max(0,(h-ground)/scale-80)); }
      c.restore();
    }
    const m = motion(g.speed, g.distance);
    const phase = m.phase;
    const stride = Math.sin(phase);
    const oval = (x:number,y:number,rx:number,ry:number,color:string | CanvasGradient) => {
      c.beginPath(); c.ellipse(x,y,rx,ry,0,0,Math.PI*2);
      c.fillStyle=color; c.fill(); c.strokeStyle="#35483d"; c.lineWidth=2; c.stroke();
    };
    c.save(); c.translate(turtleX,ground); c.scale(scale,scale);
    c.globalAlpha=.15; oval(0,4,38/(1+g.y/200),6,"#35483d"); c.globalAlpha=1;
    c.translate(0,-g.y);
    for(let i=0;i<6;i++) {
      const d=(g.distance+i*17)%100;
      c.globalAlpha=m.intensity*(1-d/100)*.4;
      oval(-35-d,2,4+d*.07,3,"#fff4d4");
    }
    c.globalAlpha=g.invulnerable&&Math.floor(g.time*14)%2?.4:1;
    if (this.body.naturalWidth) {
      const airborne = g.y > 0;
      const crawl = (1 - m.upright) * (airborne ? 0 : 1);
      const lift = airborne ? 0 : Math.abs(stride) * (1 + 3 * m.intensity) * (1 - .7 * crawl);
      const height = 68 + 16 * m.upright;
      const hipY = -10 - 6 * m.upright - lift;
      const stepLength = 8 + 13 * m.intensity;
      const sonic = m.gait === 5;

      // The supporting foot sweeps backward at ground level. The other
      // foot folds up and passes it on the way to the next contact.
      const limb = (angle: number, front: boolean, arm: boolean) => {
        const swing = airborne ? (front ? .8 : -.8) : Math.cos(angle);
        const recovery = airborne ? .7 : Math.max(0, -Math.sin(angle));
        const shoulder = arm ? 17 - 10 * crawl : -6 - 25 * crawl;
        const rootY = arm ? hipY - 24 * m.upright : hipY;
        const tipX = shoulder + stepLength * swing * (arm ? 1 - .48 * m.upright : 1);
        const footY = -5 - recovery * (7 + 11 * m.intensity - 3 * crawl);
        const tipY = arm ? footY * (1 - m.upright) + (rootY + 9 - swing * 5) * m.upright : footY;
        const controlX = (shoulder + tipX) / 2 - 7 * recovery;
        const controlY = Math.min(rootY + 8, tipY - 2);
        c.lineCap = "round";
        c.beginPath(); c.moveTo(shoulder,rootY); c.quadraticCurveTo(controlX,controlY,tipX,tipY);
        c.strokeStyle = "#59331b"; c.lineWidth = 13; c.stroke();
        c.strokeStyle = front ? "#e6e9a5" : "#c9d28c"; c.lineWidth = 9; c.stroke();
        c.beginPath(); c.ellipse(tipX+2,tipY,arm ? 7 : 9,5,-.28*swing,0,Math.PI*2);
        c.fillStyle=c.strokeStyle; c.fill(); c.strokeStyle="#59331b"; c.lineWidth=1.8; c.stroke();
      };
      if (!sonic) limb(phase + Math.PI, false, false);
      limb(phase, false, true);
      if (!sonic) limb(phase, true, false);
      const img = this.body;
      c.save();
      c.translate(-12 * crawl, 1.5 * crawl);
      c.rotate(crawl * (.32 + .018 * stride));
      const lowPose = this.crawlBody.naturalWidth > 0 && crawl > .42;
      if (!lowPose) {
        c.drawImage(img,img.width*.073,img.height*.063,img.width*.805,img.height*.815,
          -48,hipY-height+3,97,height);
      }
      c.restore();
      if (lowPose) {
        const lowHeight = 47 + 36 * m.upright;
        c.save();
        c.translate(1.2 * stride * crawl, hipY + 2);
        c.rotate(-.09 * m.upright);
        c.drawImage(this.crawlBody,-53,-lowHeight,105,lowHeight);
        c.restore();
      }
      limb(phase + Math.PI, true, true);
      if (sonic) {
        c.lineCap="round";
        for(let i=0;i<3;i++){
          c.strokeStyle=["#bf7045","#f2ae59","#ffe5a3"][i]; c.lineWidth=4-i*.7;
          const start=phase*2+i*2;
          c.beginPath(); c.ellipse(-5,-10,25+i*2,8+i,-.08,start,start+3.6); c.stroke();
        }
      }
    }
    c.restore();
    c.fillStyle="#35483d"; c.font="700 14px sans-serif"; c.fillText(gaitNames[m.gait],18,32);
  }
}
