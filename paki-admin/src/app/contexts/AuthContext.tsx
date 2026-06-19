'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { AccountRole } from '../lib/sampleAccounts';
import { getAccountRoleLabel } from '../lib/sampleAccounts';

interface User {
  id: string;
  email: string;
  name: string;
  app: 'pakiship' | 'pakipark' | 'pakiadmin';
  role?: AccountRole;
  roleLabel?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, app: 'pakiship' | 'pakipark' | 'pakiadmin') => Promise<AccountRole>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = async (
    email: string,
    password: string,
    app: 'pakiship' | 'pakipark' | 'pakiadmin',
  ) => {
    const cleanEmail = email.trim().toLowerCase();
    let accountData = null;

    try {
      // 1. Attempt login via RPC
      const { data, error } = await supabase.schema('account').rpc('fn_admin_login', {
        p_email: cleanEmail,
        p_password: password,
      });

      if (!error && data && Array.isArray(data) && data.length > 0) {
        accountData = data[0];
      } else {
        // 2. Fallback: Fetch profile directly from account.profiles if RPC fails or returns no data
        const { data: profileData, error: profileError } = await supabase
          .schema('account')
          .from('profiles')
          .select('*')
          .eq('email', cleanEmail)
          .single();

        if (!profileError && profileData) {
          accountData = {
            r_id: profileData.id,
            r_email: profileData.email,
            r_full_name: profileData.full_name,
            r_role: profileData.role,
            r_is_active: profileData.is_active,
          };
        }
      }
    } catch (err) {
      console.error('Auth process failed:', err);
    }

    // Determine final auth state
    if (accountData?.r_is_active) {
      const role = (accountData.r_role === 'super-admin' ? 'super-admin' : 'admin') as AccountRole;
      
      setUser({
        id: String(accountData.r_id),
        email: accountData.r_email,
        name: accountData.r_full_name,
        app,
        role,
        roleLabel: getAccountRoleLabel(role),
      });
      return role;
    }
    
    throw new Error('Invalid login credentials');
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
