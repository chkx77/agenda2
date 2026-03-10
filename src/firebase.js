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
  apiKey:            "AIzaSyD-9tSrke72...",
  authDomain:        "mi-agenda-12345.firebaseapp.com",
  projectId:         "mi-agenda-12345",
  storageBucket:     "mi-agenda-12345.appspot.com",
  messagingSenderId: "123456789012",
  appId:             "1:123456789012:web:abc123def456",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);