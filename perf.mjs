import { chromium } from '@playwright/test';
const URL='https://beonline.celink.mx/';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:900}});
const reqs=new Map();
page.on('request',r=>reqs.set(r,{t0:Date.now(),url:r.url()}));
page.on('requestfinished',async r=>{
  const e=reqs.get(r); if(!e)return;
  e.ms=Date.now()-e.t0;
  try{ const h=await r.response(); e.size=Number((await h.headerValue('content-length'))||0); e.status=h.status(); }catch{}
});
page.on('requestfailed',r=>{const e=reqs.get(r); if(e){e.ms=Date.now()-e.t0; e.failed=r.failure()?.errorText;}});

const t0=Date.now();
await page.goto(URL,{waitUntil:'load',timeout:90000});
const tLoad=Date.now()-t0;
await page.waitForTimeout(6000);
const tIdle=Date.now()-t0;

const nav=await page.evaluate(()=>{const n=performance.getEntriesByType('navigation')[0]||{};return{
  domContentLoaded:Math.round(n.domContentLoadedEventEnd||0), load:Math.round(n.loadEventEnd||0),
  fcp:Math.round((performance.getEntriesByName('first-contentful-paint')[0]||{}).startTime||0)}});
const lcp=await page.evaluate(()=>new Promise(res=>{let v=0;new PerformanceObserver(l=>{for(const e of l.getEntries())v=e.startTime;}).observe({type:'largest-contentful-paint',buffered:true});setTimeout(()=>res(Math.round(v)),500);}));

console.log(`load=${tLoad}ms  hasta-idle=${tIdle}ms  FCP=${nav.fcp}ms  LCP=${lcp}ms  DCL=${nav.domContentLoaded}ms`);
const all=[...reqs.values()].filter(e=>e.ms!==undefined);
console.log(`\ntotal peticiones: ${all.length}`);
console.log('\n=== 14 MAS LENTAS ===');
all.sort((a,b)=>b.ms-a.ms).slice(0,14).forEach(e=>
  console.log(`  ${String(e.ms).padStart(6)}ms ${String(e.size?Math.round(e.size/1024)+'KB':'-').padStart(8)}  ${e.failed?'[FAIL '+e.failed+'] ':''}${e.url.replace('https://beonline.celink.mx','').slice(0,96)}`));
console.log('\n=== 8 MAS PESADAS ===');
all.filter(e=>e.size).sort((a,b)=>b.size-a.size).slice(0,8).forEach(e=>
  console.log(`  ${String(Math.round(e.size/1024)).padStart(6)}KB ${String(e.ms).padStart(6)}ms  ${e.url.replace('https://beonline.celink.mx','').slice(0,96)}`));
console.log('\n=== POR HOST ===');
const byHost={};
all.forEach(e=>{const h=new URL(e.url).host; byHost[h]=byHost[h]||{n:0,ms:0,kb:0}; byHost[h].n++; byHost[h].ms=Math.max(byHost[h].ms,e.ms); byHost[h].kb+=(e.size||0)/1024;});
Object.entries(byHost).sort((a,b)=>b[1].ms-a[1].ms).forEach(([h,v])=>
  console.log(`  ${h.padEnd(30)} ${String(v.n).padStart(3)} req  max ${String(v.ms).padStart(6)}ms  ${Math.round(v.kb)}KB`));
await browser.close();
