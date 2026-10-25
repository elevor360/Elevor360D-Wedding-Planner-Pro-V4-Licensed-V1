// Elevor360D Wedding Planner Pro: client-side access gate; not tamper-proof DRM.
(()=>{'use strict';
const API='https://elevor360d-access-manager.elevor360.workers.dev';
const APP='wedding-planner-pro';
const STORAGE='elevor360d_wedding_licence_v1';
const DEVICE='elevor360d_wedding_device_v1';
// Capture install prompt before licence activation delays loading app.js.
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();window.__weddingInstallPrompt=e;});
const scripts=["app.js"];
const chars='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-';
let id=localStorage.getItem(DEVICE);
if(!id||!/^[-a-zA-Z0-9_]{12,128}$/.test(id)){
 id='dev_'+Array.from(crypto.getRandomValues(new Uint8Array(20)),v=>chars[v%chars.length]).join('');
 localStorage.setItem(DEVICE,id);
}
let started=false;
function start(){
 if(started)return;started=true;
 document.documentElement.classList.add('licence-unlocked');
 document.getElementById('licenceGate')?.remove();
 // Load all original scripts in their original order to preserve V69 behaviour.
 let i=0;
 function next(){if(i>=scripts.length)return;let el=document.createElement('script');el.src=scripts[i++];el.onload=next;el.onerror=()=>{console.error('Unable to load '+el.src);next()};document.body.appendChild(el)}
 next();
}
const gate=document.createElement('div');gate.id='licenceGate';
gate.style.cssText='position:fixed;inset:0;z-index:999999;background:#123d35;color:white;display:flex;align-items:center;justify-content:center;padding:20px;font-family:system-ui,sans-serif;overflow:auto';
gate.innerHTML=`<div style="width:min(440px,100%);padding:24px;border-radius:16px;background:#205347;box-shadow:0 10px 30px #0006"><h2 style="margin-top:0">🎣 Elevor360D Wedding Planner Pro</h2><p>Enter the licence key emailed after purchase. One-time activation; up to two devices per licence.</p><label for="licCode">Licence key</label><input id="licCode" autocomplete="off" spellcheck="false" style="box-sizing:border-box;width:100%;padding:12px;margin:8px 0 14px;border-radius:8px;border:1px solid #9ebcaf;color:#111;background:#fff" placeholder="E360-..."><button id="licActivate" style="background:#f5bd46;color:#182636;border:0;border-radius:8px;padding:12px 18px;font-weight:bold;cursor:pointer;width:100%">Activate and open app</button><p id="licMessage" role="status" aria-live="polite" style="min-height:22px"></p><small>Once activated, you can use Wedding Planner Pro offline on this device. Keep backups of your wedding planning records. Clearing browser storage may require a licence reset.</small></div>`;
document.body.appendChild(gate);
const msg=document.getElementById('licMessage'),inp=document.getElementById('licCode'),btn=document.getElementById('licActivate');
async function post(path,code){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);try{const r=await fetch(API+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code,appId:APP,deviceId:id}),signal:controller.signal});return {status:r.status,data:await r.json()}}finally{clearTimeout(timer)}}
const saved=()=>{try{return JSON.parse(localStorage.getItem(STORAGE)||'null')}catch{return null}};
const valid=code=>/^E360-[A-F0-9]{36}$/.test(code||'');
async function check(){const s=saved();if(!s||!valid(s.code)||!s.activatedAt)return;
 inp.value=s.code;
 if(!navigator.onLine){msg.textContent='Offline: opening your activated app.';start();return}
 msg.textContent='Checking saved licence…';
 try{const verified=await post('/verify',s.code);if(verified.data.ok){start();return}
 const activated=await post('/activate',s.code);if(activated.data.ok){start();return}
 msg.textContent=activated.data.error||'Licence could not be verified.';
 }catch(e){msg.textContent='Could not reach the licence server.';
 const offline=document.createElement('button');offline.textContent='Open previously activated app';offline.style.cssText='padding:10px;margin-top:8px';offline.onclick=start;msg.after(offline)}
}
btn.onclick=async()=>{const code=inp.value.trim().toUpperCase();if(!valid(code)){msg.textContent='Please enter a valid E360 licence key.';return}
 btn.disabled=true;msg.textContent='Checking activation…';try{const r=await post('/activate',code);if(r.data.ok){localStorage.setItem(STORAGE,JSON.stringify({code,activatedAt:new Date().toISOString()}));start()}else msg.textContent=r.data.error||'Activation refused.'}catch(e){msg.textContent='Connection failed. Connect to the internet and try again.'}finally{btn.disabled=false}};
check();
})();