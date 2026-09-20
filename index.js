const express = require('express');
const cors = require('cors');
const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');
const app = express();
app.use(cors());

app.get('/', (req,res)=>{
res.send(`
<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Rimuru Bot Pair</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:radial-gradient(circle at top,#1e1b4b,#0a0a23);color:white;font-family:system-ui;display:flex;justify-content:center;align-items:center;min-height:100vh;padding:20px}
.card{background:rgba(255,255,255,0.07);backdrop-filter:blur(20px);border:1px solid rgba(168,85,247,0.3);padding:35px 25px;border-radius:24px;text-align:center;width:100%;max-width:380px;box-shadow:0 0 40px rgba(124,58,237,0.4)}
h1{color:#a78bfa;font-size:26px;margin-bottom:8px} p{color:#c4b5fd;font-size:14px;margin-bottom:20px}
input{width:100%;padding:14px;border-radius:12px;border:1px solid #7c3aed;background:#0f0f2e;color:white;text-align:center;font-size:16px;outline:none;margin-bottom:15px}
button{width:100%;background:linear-gradient(135deg,#7c3aed,#a855f7);color:white;padding:14px;border:none;border-radius:12px;font-size:16px;font-weight:600;cursor:pointer}
button:active{transform:scale(0.98)}
#codeBox{margin-top:25px;display:none;background:#0f0f2e;padding:20px;border-radius:16px;border:1px dashed #a78bfa}
#code{font-size:32px;letter-spacing:3px;color:#4ade80;font-weight:bold}
#timer{color:#fbbf24;margin-top:10px;font-size:13px}
.copyBtn{margin-top:12px;background:#1e1b4b;border:1px solid #7c3aed}
</style></head><body>
<div class="card">
<h1>🔮 Rimuru Pair</h1>
<p>Enter WhatsApp number with country code</p>
<input id="num" placeholder="2349061875448" value="2349061875448">
<button id="btn" onclick="getCode()">Get Pair Code</button>
<div id="codeBox">
<div id="code"></div>
<div id="timer"></div>
<button class="copyBtn" onclick="copyCode()">Copy Code</button>
<p style="margin-top:15px;font-size:12px">Go WhatsApp > Settings > Linked Devices > Link a Device > Link with phone number</p>
</div>
</div>
<script>
let countdown;
async function getCode(){
const n=document.getElementById('num').value.replace(/[^0-9]/g,'');
if(!n) return alert('Enter number');
document.getElementById('btn').innerText='⏳ Generating...';
try{
const r=await fetch('/code?number='+n); const d=await r.json();
if(d.code){
document.getElementById('codeBox').style.display='block';
document.getElementById('code').innerText=d.code;
document.getElementById('btn').innerText='Get New Code';
let sec=60; clearInterval(countdown);
countdown=setInterval(()=>{sec--; document.getElementById('timer').innerText='Expires in '+sec+'s - ENTER FAST!'; if(sec<=0){clearInterval(countdown); document.getElementById('timer').innerText='Expired! Click Get New Code';}},1000);
}else alert(JSON.stringify(d));
}catch(e){alert(e.message); document.getElementById('btn').innerText='Get Pair Code';}
}
function copyCode(){navigator.clipboard.writeText(document.getElementById('code').innerText); alert('Copied! '+document.getElementById('code').innerText);}
</script></body></html>
`);
});

app.get('/code', async (req,res)=>{
let num=req.query.number?.replace(/[^0-9]/g,'');
if(!num) return res.json({error:'number required'});
const id='temp-'+Date.now();
try{
const {state,saveCreds}=await useMultiFileAuthState('./'+id);
const sock=makeWASocket({auth:state,logger:pino({level:'silent'}),browser:['Rimuru','Chrome','1.0']});
sock.ev.on('creds.update',saveCreds);
await new Promise(r=>setTimeout(r,2500));
const code=await sock.requestPairingCode(num);
const fmt=code.match(/.{1,4}/g)?.join('-')||code;
res.json({code:fmt});
setTimeout(()=>{try{sock.end(); fs.rmSync('./'+id,{recursive:true,force:true})}catch{}}, 120000);
}catch(e){res.json({error:e.message}); try{fs.rmSync('./'+id,{recursive:true,force:true})}catch{}}
});
app.listen(3000,()=>console.log('Rimuru Live'));
