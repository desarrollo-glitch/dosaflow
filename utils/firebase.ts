import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAd9kLcnnQO8wjntumDk24bgvfRJnGPdb4",
  authDomain: "dosatic.firebaseapp.com",
  projectId: "dosatic",
  storageBucket: "dosatic.appspot.com",
  messagingSenderId: "171202913375",
  appId: "1:171202913375:web:6e6408e776b6c111b427ea",
  measurementId: "G-HD1VB1KX4Q"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
getAnalytics(app);

// Initialize Cloud Firestore and get a reference to the service
export const firestoreDB = getFirestore(app);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Firebase Storage
export const storage = getStorage(app);