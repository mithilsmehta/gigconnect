import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  sendPasswordResetEmail,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyB5IuQ7PazXxMaMzMJn5TSrkdTihKlZQek",
  authDomain: "gigconnect-b9d61.firebaseapp.com",
  projectId: "gigconnect-b9d61",
  storageBucket: "gigconnect-b9d61.firebasestorage.app",
  messagingSenderId: "1092174341847",
  appId: "1:1092174341847:web:19959c83c6a5ca58e8f292",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export {
  auth,
  googleProvider,
  signInWithPopup,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  sendPasswordResetEmail,
  RecaptchaVerifier,
  signInWithPhoneNumber,
};