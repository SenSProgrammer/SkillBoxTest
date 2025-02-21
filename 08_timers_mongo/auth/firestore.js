//import {fs} from 'firebase-admin';

//const { initializeApp } = require("firebase-admin/app");

import { initializeApp } from "firebase-admin/app";

//import { getFirestore } from "firebase/firestore";


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



const app=initializeApp(firebaseConfig);
const db = app.firestore();
const usersDb = db.collection('users');


console.log(usersDb);


const liam = usersDb.doc('lragozzine');
await liam.set({
  first: 'Liam',
  last: 'Ragozzine',
  address: '133 5th St., San Francisco, CA',
  birthday: '05/13/1990',
  age: '30'
 });

 await usersDb.doc('vpeluso').set({
  first: 'Vanessa',
  last: 'Peluso',
  address: '49 Main St., Tampa, FL',
  birthday: '11/30/1977',
  age: '47'
 });


 const users = await db.collection('users').get();

 setTimeout(()=>{console.log(users)},2000);

 /*
db.collection('users').add({
  username: 'admin',
  password: 'PWD007',
})
.then((docRef) => {
  console.log('Document written with ID: ', docRef.id);
})
.catch((error) => {
  console.error('Error adding document: ', error);
});
*/
