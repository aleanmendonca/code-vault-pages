import { useEffect, useState } from "react";
import { getMe } from "@/lib/api";

export type AppUser = {
  id: string;
  email: string;
};

export function useAuth() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMe().then(({ user: u }) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  return { user, loading, setUser };
}
