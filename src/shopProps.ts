import type { Obstacle } from "./game";
import stickerUrl from "./shop-stickers.png";

const stickers = new Image();
stickers.src = stickerUrl;
export const stickersReady = stickers.decode().then(() => true, () => false);

export function drawProp(c: CanvasRenderingContext2D, type: Obstacle["type"], overhead = false, width = 48) {
  if ((type === "potato" || type === "sweetPotato") && stickers.complete && stickers.naturalWidth) {
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
  if(type === "coin") {
    c.beginPath();c.ellipse(24,-14,20,14,0,0,Math.PI*2);c.fillStyle="#ffce57";c.fill();c.strokeStyle="#ad792a";c.lineWidth=2;c.stroke();
    c.fillStyle="#fff1a0";c.font="bold 18px sans-serif";c.textAlign="center";c.fillText("★",24,-7);
  } else if(type === "spring") {
    tile(3,-7,42,7,3,"#e8bb72");
    c.beginPath();c.moveTo(10,-8);for(let i=0;i<4;i++)c.lineTo(i%2?10:38,-8-i*4);c.strokeStyle="#717e81";c.lineWidth=3;c.stroke();
    tile(0,-24,48,8,4,"#ed8f9e");
    c.fillStyle="#fff7df";c.font="bold 17px sans-serif";c.textAlign="center";c.fillText("↑",24,-24);
  } else if(type === "bee") {
    c.fillStyle="#f7f7ed";c.beginPath();c.ellipse(19,-33,10,5,-.5,0,Math.PI*2);c.ellipse(32,-33,10,5,.5,0,Math.PI*2);c.fill();
    tile(2,-30,44,27,13,"#eec45f");c.fillStyle="#6b5943";c.fillRect(23,-29,5,25);c.fillRect(34,-27,5,21);
    dot(12,-19,2.5,ink);dot(9,-11,3,"#ed998b");
  } else if (type === "star") {
    c.save(); c.translate(24,-24); c.beginPath();
    for(let i=0;i<10;i++){const a=i*Math.PI/5-Math.PI/2,r=i%2?11:24; c.lineTo(Math.cos(a)*r,Math.sin(a)*r);}
    c.closePath(); c.fillStyle="#ffda60"; c.fill(); c.strokeStyle="#b97a35"; c.lineWidth=2; c.stroke();
    dot(-6,-2,2,ink); dot(6,-2,2,ink); c.restore();
  } else if (type === "platform") {
    tile(0,0,width,22,3,"#b58b59"); tile(0,-3,width,9,3,"#83ae69");
  } else if (type === "cactus") {
    tile(17,-64,15,64,7,"#6eaa73");
    tile(3,-42,13,24,6,"#81ba7e"); tile(6,-25,16,9,4,"#81ba7e");
    tile(33,-52,12,26,6,"#81ba7e"); tile(28,-32,14,8,4,"#81ba7e");
    c.strokeStyle="#e5ebbb"; c.lineWidth=2;
    for(let y=-52;y<-6;y+=13){c.beginPath();c.moveTo(22,y);c.lineTo(26,y-3);c.stroke();}
  } else if (type === "rock") {
    tile(0,-32,48,32,12,"#a4abb0"); dot(18,-17,2,ink);dot(30,-17,2,ink);
  } else if(type==="hole") {
    const depth=c.createLinearGradient(0,0,0,65);
    depth.addColorStop(0,"#2c2939"); depth.addColorStop(1,"#796352");
    c.fillStyle=depth; c.fillRect(0,0,width,80);
    for (const edge of [0, width - 6]) {
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
