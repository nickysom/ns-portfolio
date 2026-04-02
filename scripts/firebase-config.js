import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js"
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js"
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js"

const firebaseConfig = {
  apiKey: "AIzaSyC1cqEjY3KijnQLG3FUG-mdMDZ4DWmogh4",
  authDomain: "nsportfolio-492116.firebaseapp.com",
  projectId: "nsportfolio-492116",
  storageBucket: "nsportfolio-492116.firebasestorage.app",
  messagingSenderId: "221248990609",
  appId: "1:221248990609:web:e90e42362cbb7804983e30"
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)
const provider = new GoogleAuthProvider()

export { auth, db, provider }