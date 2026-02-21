import { useEffect, useRef, useState } from "react";
import { Outlet } from "react-router-dom";
import { signInAnonymously } from "firebase/auth";
import { auth } from "../services/firebase/firebase";
import { useAuth } from "../context/AuthContext";

export default function RequireAuth() {
  const { user, loading } = useAuth();
  const [signingIn, setSigningIn] = useState(false);
  const inFlightRef = useRef(false);

  useEffect(() => {
    if (loading) return;
    if (user) return;
    if (inFlightRef.current) return;

    let alive = true;
    inFlightRef.current = true;

    (async () => {
      try {
        setSigningIn(true);
        await signInAnonymously(auth);
      } catch (e) {
        console.error("Anonymous sign-in failed:", e);
      } finally {
        if (alive) setSigningIn(false);
        inFlightRef.current = false;
      }
    })();

    return () => {
      alive = false;
    };
  }, [loading, user]);

  if (loading || signingIn) return <p>Loading…</p>;
  if (!user) return <p>Auth error. Please refresh.</p>;

  return <Outlet />;
}