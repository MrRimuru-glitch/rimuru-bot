const express = require('express');
const cors = require('cors');
const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');

const app = express();
app.use(cors());
const sessions = new Map();

app.get('/code', async (req, res) => {
  let num = req.query.number;
  if (!num) return res.json({ error: 'Add ?number=234...' });
  num = num.replace(/[^0-9]/g, '');
  
  const id = 'sess-'+Date.now();
  try {
    const { state, saveCreds } = await useMultiFileAuthState('./'+id);
    const sock = makeWASocket({
      auth: state,
      logger: pino({ level: 'silent' }),
      printQRInTerminal: false,
      browser: ['Chrome','Chrome','1.0']
    });
    
    sock.ev.on('creds.update', saveCreds);
    
    // keep alive
    sessions.set(id, sock);
    
    await new Promise(r => setTimeout(r, 3000));
    
    if(!sock.authState.creds.registered){
      const code = await sock.requestPairingCode(num);
      const formatted = code.match(/.{1,4}/g)?.join('-') || code;
      res.json({ code: formatted, note: 'Enter code within 60sec - DO NOT refresh page' });
      
      // auto delete after 3 mins
      setTimeout(()=>{ 
        try{ 
          sock.end(); 
          fs.rmSync('./'+id, {recursive:true, force:true});
          sessions.delete(id);
        }catch(e){} 
      }, 180000);
    } else {
      res.json({ message: 'Already registered' });
    }
  } catch(e){
    console.log(e);
    try{ fs.rmSync('./'+id, {recursive:true, force:true}) }catch(err){}
    res.json({ error: e.message });
  }
});

app.get('/', (req,res)=>res.send('Rimuru Pair - use /code?number=234...'));

app.listen(3000, ()=>console.log('Live'));
