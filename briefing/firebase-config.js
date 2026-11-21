// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/13.4.0/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBz2-O-Ru0QY507Tdk2mOrduDbMA6bTKbM",
  authDomain: "portifolio-lovato.firebaseapp.com",
  projectId: "portifolio-lovato",
  storageBucket: "portifolio-lovato.firebasestorage.app",
  messagingSenderId: "446983493769",
  appId: "1:446983493769:web:87bdd43e553e4120058e58"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
