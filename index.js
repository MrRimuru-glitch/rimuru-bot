const express = require('express');
const cors = require('cors');
const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const pino = require('pino');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/code', async (req, res) => {
  let num = req.query.number;
  if (!num) return res.json({ error: 'Number needed, e.g ?number=2349061875448' });
  
  num = num.replace(/[^0-9]/g, '');
  
  try {
    const { state, saveCreds } = await useMultiFileAuthState('./auth');
    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      logger: pino({ level: 'silent' }),
      browser: ['Rimuru-MD', 'Chrome', '1.0.0']
    });

    sock.ev.on('creds.update', saveCreds);

    if (!sock.authState.creds.registered) {
      let code = await sock.requestPairingCode(num);
      code = code?.match(/.{1,4}/g)?.join('-') || code;
      res.json({ code: code });
    } else {
      res.json({ message: 'Already registered' });
    }
  } catch (e) {
    res.json({ error: e.message });
    console.log(e);
  }
});

app.get('/', (req, res) => res.send('RIMURU MD Bot Running - /code?number=234xxx for pairing code'));

app.listen(3000, () => console.log('Live'));
