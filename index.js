const express = require('express');
const cors = require('cors');
const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const pino = require('pino');
const QRCode = require('qrcode');
const fs = require('fs');
const app = express();
app.use(cors());
let latestQR = null;

app.get('/', (req,res)=>{
res.send(`<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Rimuru QR</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{background:radial-gradient(circle at top,#1e1b4b,#0a0a23);color:white;font-family:system-ui;display:flex;justify-content:center;align-items:center;min-height:100vh;padding:20px}
.card{background:rgba(255,255,255,0.07);backdrop-filter:blur(20px);border:1px solid rgba(168,85,247,0.3);padding:30px 25px;border-radius:24px;text-align:center;width:100%;max-width:380px;box-shadow:0 0 40px rgba(124,58,237,0.4)}
h1{color:#a78bfa;font-size:26px} p{color:#c4b5fd;font-size:14px;margin:10px 0 20px}
button{width:100%;background:linear-gradient(135deg,#7c3aed,#a855f7);color:white;padding:14px;border:none;border-radius:12px;font-size:16px;font-weight:600;cursor:pointer;margin-top:15px}
#qr{margin:20px auto;background:white;padding:12px;border-radius:16px;display:none}
#qr img{width:100%}</style></head><body>
<div class="card"><h1>🔮 Rimuru QR Pair</h1><p>QR dey stable pass code for iPhone</p>
<div id="qr"></div>
<button onclick="getQR()">Generate QR Code</button>
<p style="margin-top:15px;font-size:12px">WhatsApp > Settings > Linked Devices > Link a Device > Scan QR</p>
</div>
<script>
async function getQR(){
document.getElementById('qr').style.display='block';
document.getElementById('qr').innerHTML='⏳ Loading... Wait 10 sec (Render dey wake)...';
try{
const r=await fetch('/getqr'); const d=await r.json();
if(d.qr){document.getElementById('qr').innerHTML='<img src="'+d.qr+'"><p style="color:#000;margin-top:8px">Scan within 60s!</p>'; setTimeout(getQR, 45000);}
else document.getElementById('qr').innerHTML='Error: '+JSON.stringify(d);
}catch(e){document.getElementById('qr').innerHTML='Error, try again';}
}
</script></body></html>`);
});

app.get('/getqr', async (req,res)=>{
const id='qr-'+Date.now();
try{
const {state,saveCreds}=await useMultiFileAuthState('./'+id);
const sock=makeWASocket({auth:state,logger:pino({level:'silent'}),browser:['Rimuru','Chrome','1.0']});
sock.ev.on('creds.update',saveCreds);
sock.ev.on('connection.update', async (u)=>{
if(u.qr){ latestQR = await QRCode.toDataURL(u.qr); }
});
await new Promise(r=>setTimeout(r,5000));
res.json({qr:latestQR});
setTimeout(()=>{try{sock.end(); fs.rmSync('./'+id,{recursive:true,force:true})}catch{}}, 120000);
}catch(e){res.json({error:e.message})}
});
app.listen(3000);
