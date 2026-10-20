"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, firebaseConfigured } from "@/lib/firebase";
import { subscribeUserData } from "@/lib/repositories/user-data";
import { defaultProfile, saveTheme } from "@/lib/repositories/profile";
const AppContext = createContext({
  user: null,
  sites: [],
  observations: [],
  profile: defaultProfile,
  loading: true,
  profileLoading: false,
  error: "",
  profileError: "",
  configured: false,
  theme: "dark",
  setTheme: async () => {},
  logout: async () => {},
  refreshUser: async () => {},
});
export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [, bumpSession] = useState(0);
  const [sites, setSites] = useState([]),
    [observations, setObservations] = useState([]);
  const [profile, setProfile] = useState(defaultProfile),
    [theme, applyTheme] = useState("dark");
  const [authLoading, setAuthLoading] = useState(firebaseConfigured),
    [sitesLoading, setSitesLoading] = useState(false),
    [profileLoading, setProfileLoading] = useState(false);
  const [error, setError] = useState(""),
    [profileError, setProfileError] = useState("");
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(
      auth,
      (u) => {
        setSites([]);
        setObservations([]);
        setError("");
        setProfileError("");
        setProfile(defaultProfile);
        applyTheme("dark");
        setUser(u);
        setAuthLoading(false);
        setSitesLoading(Boolean(u));
        setProfileLoading(Boolean(u));
      },
      () => {
        setError("Não foi possível verificar sua sessão.");
        setAuthLoading(false);
      },
    );
  }, []);
  useEffect(() => {
    if (!user) return;
    return subscribeUserData(user, {
      setSites,
      setObservations,
      setProfile,
      applyTheme,
      setSitesLoading,
      setProfileLoading,
      setError,
      setProfileError,
    });
  }, [user?.uid]);
  async function changeTheme(next) {
    if (!["dark", "light", "red"].includes(next)) return;
    if (user) await saveTheme(user.uid, next);
    applyTheme(next);
  }
  return (
    <AppContext.Provider
      value={{
        user,
        sites,
        observations,
        profile,
        loading: authLoading || sitesLoading,
        profileLoading,
        error,
        profileError,
        configured: firebaseConfigured,
        theme,
        setTheme: changeTheme,
        refreshUser: async () => {
          if (auth?.currentUser) {
            await auth.currentUser.reload();
            setUser(auth.currentUser);
            bumpSession((n) => n + 1);
          }
        },
        logout: async () => {
          if (auth) await signOut(auth);
        },
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
export const useApp = () => useContext(AppContext);
