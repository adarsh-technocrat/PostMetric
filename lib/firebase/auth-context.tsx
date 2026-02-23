"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { auth } from "./client";
import { setAuthCookie, clearAuthCookie } from "@/lib/auth-cookie";

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const idToken = await firebaseUser.getIdToken(false);
          setAuthCookie(idToken);

          const cachedUser = localStorage.getItem("firebaseUser");
          if (cachedUser) {
            try {
              const parsedUser = JSON.parse(cachedUser);
              if (parsedUser && parsedUser.email === firebaseUser.email) {
                setUser(firebaseUser);
              }
            } catch (e) {
              localStorage.removeItem("firebaseUser");
            }
          }

          const response = await fetch("/api/auth/firebase/verify", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ idToken }),
          });

          if (response.ok) {
            const data = await response.json();
            localStorage.setItem("firebaseUser", JSON.stringify(data.user));
            setUser(firebaseUser);
          } else {
            if (response.status === 401) {
              await firebaseSignOut(auth);
              clearAuthCookie();
              localStorage.removeItem("firebaseUser");
              setUser(null);
            } else if (cachedUser) {
              try {
                const parsedUser = JSON.parse(cachedUser);
                if (parsedUser && parsedUser.email === firebaseUser.email) {
                  setUser(firebaseUser);
                } else {
                  localStorage.removeItem("firebaseUser");
                }
              } catch (e) {
                localStorage.removeItem("firebaseUser");
              }
            }
          }
        } catch (error) {
          await firebaseSignOut(auth);
          clearAuthCookie();
          localStorage.removeItem("firebaseUser");
          setUser(null);
        }
      } else {
        clearAuthCookie();
        localStorage.removeItem("firebaseUser");
        setUser(null);
      }
      setLoading(false);
    });

    const refreshToken = setInterval(async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        try {
          const idToken = await currentUser.getIdToken(true);
          setAuthCookie(idToken);
        } catch (error) {
        }
      }
    }, 55 * 60 * 1000);

    return () => {
      unsubscribe();
      clearInterval(refreshToken);
    };
  }, []);

  const signOut = async () => {
    await firebaseSignOut(auth);
    localStorage.removeItem("firebaseUser");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
