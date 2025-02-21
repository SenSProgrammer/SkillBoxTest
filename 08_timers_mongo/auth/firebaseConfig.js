const firebase = require('firebase/app');
require('firebase/auth');
require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyBTCPbMnIp4QAk99IvUFKkXu1az9rgUdZ0",
  authDomain: "timers-18c64.firebaseapp.com",
  databaseURL: "https://timers-18c64-default-rtdb.firebaseio.com",
  projectId: "timers-18c64",
  storageBucket: "timers-18c64.firebasestorage.app",
  messagingSenderId: "206971021560",
  appId: "1:206971021560:web:bc7e61276b03499336730d",
  measurementId: "G-M3X472FL6Y"
};

firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();
module.exports = { firebase, db };
