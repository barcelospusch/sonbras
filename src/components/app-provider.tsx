"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { auth, firebaseConfigured } from "@/lib/firebase";
import type { Observation, Profile, Site, Theme } from "@/lib/types";
import { defaultProfile, subscribeUserData, saveTheme } from '@/lib/repositories/user-data';

type Context = {
  user: User | null;
  sites: Site[];
  observations: Observation[];
  profile: Profile;
  loading: boolean;
  profileLoading: boolean;
  error: string;
  profileError: string;
  configured: boolean;
  theme: Theme;
  setTheme: (theme: Theme) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};
const AppContext = createContext<Context>({
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
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [, bumpSession] = useState(0);
  const [sites, setSites] = useState<Site[]>([]),
    [observations, setObservations] = useState<Observation[]>([]);
  const [profile, setProfile] = useState<Profile>(defaultProfile),
    [theme, applyTheme] = useState<Theme>("dark");
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
      setSites, setObservations, setProfile, applyTheme,
      setSitesLoading, setProfileLoading, setError, setProfileError,
    });
  }, [user?.uid]);
  async function changeTheme(next: Theme) {
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
