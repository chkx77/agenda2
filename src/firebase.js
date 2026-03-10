// ============================================================
//  firebase.js  —  EDITÁ ESTE ARCHIVO con tu configuración
//
//  1. console.firebase.google.com → tu proyecto → ícono </>
//  2. Copiá firebaseConfig y pegalo acá abajo
//  3. Activá Authentication → Email/Contraseña
//  4. Creá Firestore Database en modo producción
//  5. Pegá las reglas de seguridad del README
// ============================================================

import { initializeApp } from "firebase/app";
import { getAuth }       from "firebase/auth";
import { getFirestore }  from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD9sFYYLqkYA3zkNN8mgnW4SAZtlPpfvm4",
  authDomain: "agendan2.firebaseapp.com",
  projectId: "agendan2",
  storageBucket: "agendan2.firebasestorage.app",
  messagingSenderId: "592707981924",
  appId: "1:592707981924:web:421bf88b9cc5086f968571"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);
