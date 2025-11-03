import { useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { supabase } from "./supabase";

export function useAuthPersistence() {
  const [isRestoring, setIsRestoring] = useState(true);

  useEffect(() => {
    // Restore session when app launches
    const restoreSession = async () => {
      try {
        const savedSession = await SecureStore.getItemAsync("supabase-session");
        if (savedSession) {
          const { data, error } = await supabase.auth.setSession(JSON.parse(savedSession));
          if (error) console.error("Error restoring session:", error);
        }
      } catch (error) {
        console.error("Session restore failed:", error);
      } finally {
        setIsRestoring(false);
      }
    };

    restoreSession();

    // Save or clear session whenever auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        SecureStore.setItemAsync("supabase-session", JSON.stringify(session));
      } else {
        SecureStore.deleteItemAsync("supabase-session");
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return isRestoring;
}
