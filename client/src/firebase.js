import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Firebase Configuration
// To get your Firebase credentials:
// 1. Go to https://console.firebase.google.com/
// 2. Create a new project or select existing one
// 3. Click on Web icon (</>) to register your app
// 4. Copy the config object and paste it below
// 5. Enable Google Authentication in Firebase Console → Authentication → Sign-in method
const firebaseConfig = {
  apiKey: "AIzaSyC6gC534cbL2Yp0UOng-KA6ReIIlRXxRts",
  authDomain: "whatsapp-clone-1ff34.firebaseapp.com",
  projectId: "whatsapp-clone-1ff34",
  storageBucket: "whatsapp-clone-1ff34.firebasestorage.app",
  messagingSenderId: "638929699628",
  appId: "1:638929699628:web:902af096850e3bb9d1e289",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth();

// Initialize Google Auth Provider
const provider = new GoogleAuthProvider();

export { auth, provider, app };
