// ============================================================
//  Root.jsx — Router simple sin librería externa
//
//  /turno/:uid  → BookingView (público, sin auth)
//  cualquier otra ruta → AuthScreen / OwnerApp
// ============================================================
import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase.js";
import AuthScreen  from "./AuthScreen.jsx";
import OwnerApp    from "./OwnerApp.jsx";
import BookingView from "./BookingView.jsx";
import { T, GLOBAL_STYLES } from "./ui.jsx";

function getRoute() {
  const path = window.location.pathname;
  const match = path.match(/^\/turno\/([^/]+)/);
  if (match) return { type: "booking", propietarioId: match[1] };
  return { type: "owner" };
}

export default function Root() {
  const route = getRoute();

  // Si es vista pública, no necesitamos auth
  if (route.type === "booking") {
    return <BookingView propietarioId={route.propietarioId} />;
  }

  // Vista del propietario — requiere auth
  return <OwnerGate />;
}

function OwnerGate() {
  const [user,     setUser]     = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => { setUser(u); setChecking(false); });
    return unsub;
  }, []);

  if (checking) return (
    <div style={{ minHeight:"100vh", background:T.bg, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Archivo Black',sans-serif" }}>
      <style>{GLOBAL_STYLES}</style>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:"2rem", fontWeight:900, color:T.accent, letterSpacing:"-0.02em" }}>AGENDA PRO</div>
        <div style={{ fontSize:"0.62rem", fontWeight:800, textTransform:"uppercase", letterSpacing:"0.16em", color:T.textLight, marginTop:"6px" }}>Cargando...</div>
      </div>
    </div>
  );

  if (!user) return <AuthScreen />;
  return <OwnerApp user={user} />;
}
