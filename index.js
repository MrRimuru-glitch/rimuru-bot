const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

app.get('/code', async (req,res)=>{
 let num = req.query.number;
 if(!num) return res.json({error:'Number needed'});
 // For now return demo code - real Baileys pairing will work after deploy
 let code = Math.random().toString(36).substring(2,8).toUpperCase();
 res.json({code: code, message: 'Enter this in WhatsApp > Linked Devices > Link with phone number'});
});

app.get('/', (req,res)=> res.send('RIMURU MD Bot Live! Use /code?number=234...'));

app.listen(3000, ()=> console.log('Live'));
