// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBmaWJ6mjgmPvEpHt_JKjNFEXjX822ykgk",
  authDomain: "keyroz-vision.firebaseapp.com",
  projectId: "keyroz-vision",
  storageBucket: "keyroz-vision.appspot.com",
  messagingSenderId: "89657404037",
  appId: "1:89657404037:web:d1c6f1bd53037a0e5c57ec"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth, app };
