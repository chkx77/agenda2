import { useState } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "./firebase.js";
import { saveConfig } from "./db.js";
import { DEFAULT_CONFIG, uid } from "./helpers.js";
import { T, GLOBAL_STYLES, Btn, Fld, inp } from "./ui.jsx";

const ERR = {
  "auth/user-not-found":       "No existe una cuenta con ese email.",
  "auth/wrong-password":       "Contraseña incorrecta.",
  "auth/email-already-in-use": "Ese email ya está registrado.",
  "auth/weak-password":        "La contraseña debe tener al menos 6 caracteres.",
  "auth/invalid-email":        "El formato del email no es válido.",
  "auth/too-many-requests":    "Demasiados intentos. Esperá unos minutos.",
  "auth/invalid-credential":   "Email o contraseña incorrectos.",
};

export default function AuthScreen() {
  const [mode, setMode]       = useState("login");
  const [email, setEmail]     = useState("");
  const [pass, setPass]       = useState("");
  const [pass2, setPass2]     = useState("");
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const clear = () => { setError(""); setSuccess(""); };

  const handleLogin = async () => {
    if (!email || !pass) { setError("Completá todos los campos."); return; }
    setLoading(true); clear();
    try { await signInWithEmailAndPassword(auth, email, pass); }
    catch (e) { setError(ERR[e.code] || "Ocurrió un error."); }
    finally { setLoading(false); }
  };

  const handleRegister = async () => {
    if (!email || !pass || !pass2) { setError("Completá todos los campos."); return; }
    if (pass !== pass2) { setError("Las contraseñas no coinciden."); return; }
    setLoading(true); clear();
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      // Crear config inicial con link público único
      await saveConfig(cred.user.uid, { ...DEFAULT_CONFIG, publicLink: cred.user.uid });
    }
    catch (e) { setError(ERR[e.code] || "Ocurrió un error."); }
    finally { setLoading(false); }
  };

  const handleForgot = async () => {
    if (!email) { setError("Ingresá tu email."); return; }
    setLoading(true); clear();
    try { await sendPasswordResetEmail(auth, email); setSuccess("Te enviamos un link de recuperación."); }
    catch (e) { setError(ERR[e.code] || "Ocurrió un error."); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:"100vh", background:T.bg, display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem", fontFamily:"'DM Sans',sans-serif" }}>
      <style>{GLOBAL_STYLES}</style>
      <div style={{ width:"100%", maxWidth:"400px", animation:"fadeUp 0.3s ease" }}>
        {/* Header */}
        <div style={{ textAlign:"center", marginBottom:"2rem" }}>
          <div style={{ width:"52px", height:"52px", background:T.accent, display:"inline-flex", alignItems:"center", justifyContent:"center", marginBottom:"1rem" }}>
            <span style={{ fontSize:"1.4rem" }}>📅</span>
          </div>
          <div style={{ fontSize:"1.8rem", fontWeight:900, color:T.accent, fontFamily:"'Archivo Black',sans-serif", letterSpacing:"-0.02em", lineHeight:1 }}>AGENDA PRO</div>
          <div style={{ fontSize:"0.62rem", fontWeight:800, textTransform:"uppercase", letterSpacing:"0.16em", color:T.textLight, marginTop:"4px" }}>
            Panel del profesional
          </div>
        </div>

        <div style={{ background:T.surface, border:`3px solid ${T.accent}`, boxShadow:`6px 6px 0 ${T.borderDk}`, padding:"2rem" }}>
          {/* Tabs */}
          {mode !== "forgot" && (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", border:`2px solid ${T.borderDk}`, marginBottom:"1.5rem" }}>
              {[["login","Ingresar"],["register","Registrarse"]].map(([m,l]) => (
                <button key={m} onClick={() => { setMode(m); clear(); }} style={{ padding:"0.55rem", border:"none", borderRadius:0, background:mode===m?T.accent:T.surface, color:mode===m?T.textInv:T.textMid, cursor:"pointer", fontFamily:"inherit", fontWeight:800, fontSize:"0.78rem", textTransform:"uppercase", letterSpacing:"0.08em", borderRight:m==="login"?`2px solid ${T.borderDk}`:"none" }}>{l}</button>
              ))}
            </div>
          )}

          <Fld label="Email" req>
            <input type="email" style={inp} value={email} placeholder="tu@email.com"
              onChange={e => { setEmail(e.target.value); clear(); }}
              onKeyDown={e => e.key==="Enter" && (mode==="login"?handleLogin():mode==="register"?handleRegister():handleForgot())}
            />
          </Fld>

          {mode !== "forgot" && (
            <Fld label="Contraseña" req>
              <input type="password" style={inp} value={pass} placeholder="Mínimo 6 caracteres"
                onChange={e => { setPass(e.target.value); clear(); }}
                onKeyDown={e => e.key==="Enter" && (mode==="login"?handleLogin():handleRegister())}
              />
            </Fld>
          )}
          {mode === "register" && (
            <Fld label="Repetir contraseña" req>
              <input type="password" style={inp} value={pass2} placeholder="Repetí la contraseña"
                onChange={e => { setPass2(e.target.value); clear(); }}
                onKeyDown={e => e.key==="Enter" && handleRegister()}
              />
            </Fld>
          )}

          {error   && <div style={{ background:"#FDF0EE", border:`2px solid ${T.red}`, padding:"0.6rem 0.8rem", marginBottom:"1rem", fontSize:"0.8rem", color:T.red, fontWeight:600 }}>{error}</div>}
          {success && <div style={{ background:"#EFF7F5", border:`2px solid ${T.teal}`, padding:"0.6rem 0.8rem", marginBottom:"1rem", fontSize:"0.8rem", color:T.teal, fontWeight:600 }}>{success}</div>}

          <Btn onClick={mode==="login"?handleLogin:mode==="register"?handleRegister:handleForgot} loading={loading} style={{ width:"100%", justifyContent:"center" }}>
            {mode==="login"?"Ingresar":mode==="register"?"Crear cuenta":"Enviar link"}
          </Btn>

          <div style={{ marginTop:"1rem", textAlign:"center" }}>
            {mode==="login" && <button onClick={() => { setMode("forgot"); clear(); }} style={{ background:"none", border:"none", cursor:"pointer", fontSize:"0.78rem", color:T.teal, fontWeight:700, textDecoration:"underline" }}>Olvidé mi contraseña</button>}
            {mode==="forgot" && <button onClick={() => { setMode("login"); clear(); }} style={{ background:"none", border:"none", cursor:"pointer", fontSize:"0.78rem", color:T.textMid, fontWeight:700 }}>← Volver al login</button>}
          </div>
        </div>
      </div>
    </div>
  );
}
