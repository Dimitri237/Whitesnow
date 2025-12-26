import { initializeApp } from "firebase/app"
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore"
import { getAuth } from "firebase/auth"

const firebaseConfig = {
  apiKey: "AIzaSyDaoExO9o9ntisG-8rspxdPhrAJVI3VV7g",
  authDomain: "whitesnow-273d1.firebaseapp.com",
  projectId: "whitesnow-273d1",
  storageBucket: "whitesnow-273d1.firebasestorage.app",
  messagingSenderId: "409196850510",
  appId: "1:409196850510:web:5b0d4594cbade83edcc21f",
  measurementId: "G-BPB1198PS8"
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