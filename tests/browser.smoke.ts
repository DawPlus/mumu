const el = (id: string) => document.getElementById(id)!;
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const assert = (ok: unknown, message: string) => { if (!ok) throw new Error(message); };
const key = (type: string) => el('scene').dispatchEvent(new KeyboardEvent(type, {code:'Space',bubbles:true}));
export async function checkRunner() {
  async function height(hold: number) {
    el('retry').click(); await new Promise(requestAnimationFrame); key('keydown'); let peak=0;
    for(let t=0;t<800;t+=20){if(t===hold)key('keyup');await wait(20);peak=Math.max(peak,Number(el('scene').dataset.y));}
    key('keyup'); return peak;
  }
  const short=await height(60),long=await height(300);
  assert(short>0 && long>short*1.8, `jump heights ${short}/${long}`);
  el('retry').click(); el('pause').click(); const distance=el('scene').dataset.distance;
  await wait(200); assert(el('scene').dataset.distance===distance,'pause advanced game');
  el('begin').click();
  for(let i=0;i<40 && el('scene').dataset.distance===distance;i++) await wait(50);
  assert(el('scene').dataset.distance!==distance,'resume failed');
  el('toy').click(); assert(el('toy').getAttribute('aria-pressed')==='true','3D failed');
  el('cartoon').click(); assert(el('cartoon').getAttribute('aria-pressed')==='true','cartoon failed');
  el('retry').click(); assert(el('scene').dataset.distance==='0','retry failed');
  window.dispatchEvent(new Event('blur')); assert(el('scene').dataset.paused==='true','blur did not pause');
  assert(document.documentElement.scrollWidth<=innerWidth,'horizontal overflow');
  return {short,long,pause:'PASS',modes:'PASS',retry:'PASS',background:'PASS'};
}
export async function checkTurbo() {
  el('retry').click();
  const deadline=performance.now()+5000;
  while(!el('scene').classList.contains('turbo') && performance.now()<deadline) await wait(25);
  assert(el('scene').classList.contains('turbo'),'opening coin chain did not activate turbo');
  assert(el('coins').textContent?.includes('5'),'coin counter missing');
  assert(!el('power').hidden && el('power').textContent?.includes('터보'),'turbo HUD missing');
  el('toy').click();
  assert(el('scene').classList.contains('turbo'),'mode switch lost turbo');
  el('pause').click();const power=el('power').textContent;
  await wait(250);assert(el('power').textContent===power,'turbo timer ran while paused');
  return {coins:el('coins').textContent,turbo:'PASS',mode:'PASS',pause:'PASS'};
}
