import type { Obstacle } from "./game";
import stickerUrl from "./shop-stickers.png";

const stickers = new Image();
stickers.src = stickerUrl;
export const stickersReady = stickers.decode().then(() => true, () => false);

export function drawProp(c: CanvasRenderingContext2D, type: Obstacle["type"], overhead = false) {
  if (type !== "hole" && stickers.complete && stickers.naturalWidth) {
    const column = type === "potato" ? 0 : 192;
    c.drawImage(stickers,column,0,192,220,0,-55,48,55);
    return;
  }
  const ink = "#443b40";
  function tile(x:number,y:number,w:number,h:number,r:number,color:string) {
    c.beginPath(); c.roundRect(x,y,w,h,r); c.fillStyle=color; c.fill();
    c.lineWidth=1.6; c.strokeStyle=ink; c.stroke();
  }
  function dot(x:number,y:number,r:number,color:string) {
    c.beginPath(); c.arc(x,y,r,0,Math.PI*2); c.fillStyle=color; c.fill();
  }
  if(type==="hole") {
    const depth=c.createLinearGradient(0,0,0,65);
    depth.addColorStop(0,"#2c2939"); depth.addColorStop(1,"#796352");
    c.fillStyle=depth; c.fillRect(0,0,48,80);
    for (const edge of [0, 42]) {
      const length = overhead ? 72 : 25;
      tile(edge,0,6,length,1,"#e7b761");
      c.fillStyle = "#6b5045";
      for (let y=4; y<length-4; y+=10) {
        c.beginPath(); c.moveTo(edge,y+3); c.lineTo(edge+6,y);
        c.lineTo(edge+6,y+4); c.lineTo(edge,y+7); c.closePath(); c.fill();
      }
    }
    if (!overhead) {
      c.strokeStyle="#ae8a70"; c.lineWidth=2; c.beginPath();
      c.moveTo(6,7); c.lineTo(10,11); c.lineTo(8,18); c.lineTo(13,21); c.stroke();
      dot(36,27,2.3,"#ac8d77"); dot(33,34,1.3,"#ac8d77");
    }
  } else {
    c.beginPath(); c.ellipse(24,-21,22,18,type==="potato"?0:-.45,0,Math.PI*2);
    c.fillStyle=type==="potato"?"#d3a061":"#9a5476"; c.fill(); c.strokeStyle=ink; c.stroke();
    dot(15,-24,1.8,ink);dot(29,-24,1.8,ink);
  }
}
