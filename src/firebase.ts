// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBl0x0yHXJPv1FOvGYmhkyG1L7jo05TDLo",
  authDomain: "thedecorparty-9fef9.firebaseapp.com",
  projectId: "thedecorparty-9fef9",
  storageBucket: "thedecorparty-9fef9.firebasestorage.app",
  messagingSenderId: "152215460267",
  appId: "1:152215460267:web:95e34d71adf2f1bd0b1aee",
  measurementId: "G-37R8BGG9G9"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();

const analytics = getAnalytics(app);