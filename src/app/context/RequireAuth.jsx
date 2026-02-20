import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { signInAnonymously } from "firebase/auth";
import { auth } from "../services/firebase/firebase";
import { useAuth } from "../context/AuthContext";

export default function RequireAuth() {
  const { user, loading } = useAuth();
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (user) return;

    let alive = true;
    (async () => {
      try {
        setSigningIn(true);
        await signInAnonymously(auth);
      } catch (e) {
        console.error("Anonymous sign-in failed:", e);
      } finally {
        if (alive) setSigningIn(false);
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