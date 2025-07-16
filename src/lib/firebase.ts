// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCv1iJp9KJFziCRVGiH45l420YZ4973eoo",
  authDomain: "kdsvision-backup.firebaseapp.com",
  projectId: "kdsvision-backup",
  storageBucket: "kdsvision-backup.appspot.com",
  messagingSenderId: "146882141427",
  appId: "1:146882141427:web:ce60d74d286d1a9a036b86",
  measurementId: "G-NH3EKCDYV6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db, app };
