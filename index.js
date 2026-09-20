const express = require('express');
const cors = require('cors');
const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/code', async (req, res) => {
  let num = req.query.number;
  if (!num) return res.json({ error: 'Add ?number=234...' });
  num = num.replace(/[^0-9]/g, '');
  
  const id = Date.now().toString();
  try {
    const { state, saveCreds } = await useMultiFileAuthState('./temp-'+id);
    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      logger: pino({ level: 'silent' }),
      browser: ['Ubuntu','Chrome','20.0']
    });
    
    sock.ev.on('creds.update', saveCreds);
    
    // small delay to let socket connect
    await new Promise(r => setTimeout(r, 3000));
    
    if (!sock.authState.creds.registered) {
      const code = await sock.requestPairingCode(num);
      const formatted = code?.match(/.{1,4}/g)?.join('-') || code;
      res.json({ code: formatted });
    } else {
      res.json({ message: 'Already paired' });
    }
    
    // cleanup
    setTimeout(()=> { try{ fs.rmSync('./temp-'+id, {recursive:true, force:true}) }catch(e){} }, 5000);
    
  } catch (e) {
    console.log(e);
    try{ fs.rmSync('./temp-'+id, {recursive:true, force:true}) }catch(e){}
    res.json({ error: e.message, retry: 'Refresh again' });
  }
});

app.get('/', (req, res) => res.send('Bot Running - use /code?number=234...'));

app.listen(3000, () => console.log('Live'));
