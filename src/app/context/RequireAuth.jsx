import { useEffect, useRef, useState } from "react";
import { Outlet } from "react-router-dom";
import { signInAnonymously } from "firebase/auth";
import { auth } from "../services/firebase/firebase";
import { useAuth } from "./AuthContext";

export default function RequireAuth() {
  const { user, loading } = useAuth();
  const [signingIn, setSigningIn] = useState(false);
  const triedRef = useRef(false);
  const [err, setErr] = useState(null);
  const [authErr, setAuthErr] = useState(null);

  useEffect(() => {
    if (loading) return;
    if (user) return;
    if (triedRef.current) return;
    triedRef.current = true;

    let alive = true;
    (async () => {
      try {
        setSigningIn(true);
        await signInAnonymously(auth);
      } catch (e) {
        console.error("Anonymous sign-in failed:", e);
        setAuthErr(String(e?.message || e));
        if (alive) setErr(e?.code || e?.message || String(e));
      } finally {
        if (alive) setSigningIn(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [loading, user]);

  if (loading || signingIn) return <p>Loading…</p>;
  if (err) return <p>Auth error: {err}</p>;
  if (!user) return <p>Auth error. Please refresh.</p>;
  if (authErr) return <pre style={{whiteSpace:"pre-wrap"}}>{authErr}</pre>;

  return <Outlet />;
}
