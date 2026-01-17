import { initializeApp } from "firebase/app"
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore"
import { getAuth } from "firebase/auth"

const firebaseConfig = {
  apiKey: "AIzaSyB7WmPgL90yWOuSu4CUVA_EttNOr0SNkbA",
  authDomain: "whitesnow2-b27b8.firebaseapp.com",
  projectId: "whitesnow2-b27b8",
  storageBucket: "whitesnow2-b27b8.firebasestorage.app",
  messagingSenderId: "704968201517",
  appId: "1:704968201517:web:66dc397bf7d63b02dcefa4",
  measurementId: "G-Y7ZKHE0GWS"
};
const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)

enableIndexedDbPersistence(db)
  .then(() => console.log("🔥 Offline activé"))
  .catch(() => console.log("Offline non supporté"))

  window.addEventListener("offline", ()=> alert("Mode hors ligne activé"))
window.addEventListener("online", ()=> alert("Connexion rétablie"))
/*
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{doc=**} {
      allow read, write: if request.auth != null;
    }
  }
}
*/