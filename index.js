import express from 'express';
import https from 'https';
import fs from 'fs';
import { createWriteStream } from 'fs';
import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';


import dotenv from 'dotenv';
dotenv.config()


const firebaseConfig = {
    apiKey: process.env.API_KEY,
    authDomain: process.env.AUTH_DOMAIN,
    projectId: process.env.PROJECT_ID,
    storageBucket:process.env.STORAGE_BUCKET,
    messagingSenderId: process.env.MESSAGING_SENDER_ID,
    appId: process.env.APP_ID,
    measurementId: process.env.MEASUREMENT_ID,
};

const app = express();
const port = 3000;
app.use(express.json());
// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const storage = getStorage(firebaseApp);

app.get('/', (req, res) => {
  console.log("We're here");
  res.send("Hello from the server!");
});

app.post('/text-to-speech', (req, res) => {
  
    const { text, voiceSettings,voiceId } = req.body;
  
    const options = {
      hostname: 'api.elevenlabs.io',
      path: `/v1/text-to-speech/${voiceId}/stream`,
      method: 'POST',
      headers: {
        'accept': 'audio/mpeg',
        'xi-api-key':process.env.XI_API_KEY,
        'Content-Type': 'application/json'
      }
    };
  
    const request = https.request(options, (response) => {
      console.log(`statusCode: ${response.statusCode}`);
      const audioFile = createWriteStream('audio.mp3');
      response.pipe(audioFile);
      audioFile.on('finish', () => {
        const audRef = ref(storage, `audios/${Math.random()}.mp3`);
        uploadBytes(audRef, fs.readFileSync('audio.mp3')).then((snapshot) => {
          getDownloadURL(snapshot.ref).then((url) => {
            console.log(url);
            res.send(url);
          });
        }).catch((error) => {
          console.error('Error uploading audio:', error);
          res.status(500).send('Error occurred');
        });
      });
  
      response.on('end', () => {
        console.log('new Audio file saved successfully');
      });
    });
  
    request.on('error', (error) => {
      console.error(error);
      res.status(500).send('Error occurred');
    });
  
    request.write(JSON.stringify({
      text: text,
      voice_settings: voiceSettings
    }));
  
    request.end();
  });
  

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
