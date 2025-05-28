import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/router';
import api from '../services/api';
import { getCurrentUser as fetchCurrentUserAPI } from '../services/authService';


export interface User {
    id: number;
    email: string;
    full_name: string | null;
    is_active: boolean;
    is_confirmed_by_admin: boolean;
    role: 'admin' | 'worker';
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (token: string) => Promise<void>;
    logout: () => void;
    fetchUser: (tokenToUse?: string) => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    const logout = useCallback(() => {
        localStorage.removeItem('authToken');
        setToken(null);
        setUser(null);
        delete api.defaults.headers.common['Authorization'];
        setIsLoading(false);
        const publicPaths = ['/login', '/register', '/'];
        if (!publicPaths.includes(router.pathname)) {
            router.push(`/login?message=${encodeURIComponent('You have been logged out.')}`);
        }
    }, [router]);

    const fetchUser = useCallback(async (tokenToUse?: string): Promise<User | null> => {
        const activeToken = tokenToUse || localStorage.getItem('authToken');

        if (!activeToken) {
            setUser(null);
            setToken(null);
            setIsLoading(false);
            return null;
        }

        if (api.defaults.headers.common['Authorization'] !== `Bearer ${activeToken}`) {
            api.defaults.headers.common['Authorization'] = `Bearer ${activeToken}`;
        }
        if (token !== activeToken) {
            setToken(activeToken);
        }

        setIsLoading(true);
        try {
            const userData = await fetchCurrentUserAPI();
            setUser(userData);
            return userData;
        } catch (error: any) {
            console.error('AuthContext: Failed to fetch user data:', error);
            if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                logout();
            } else {
                setUser(null);
            }
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [logout, token]);

    useEffect(() => {
        const storedToken = localStorage.getItem('authToken');
        if (storedToken) {
            fetchUser(storedToken);
        } else {
            setIsLoading(false);
        }
    }, [fetchUser]);

    const login = async (newToken: string): Promise<void> => {
        localStorage.setItem('authToken', newToken);

        const fetchedUser = await fetchUser(newToken);

        if (fetchedUser) {
            if (fetchedUser.role === 'admin') {
                router.push('/admin');
            } else if (fetchedUser.role === 'worker' && fetchedUser.is_confirmed_by_admin && fetchedUser.is_active) {
                router.push('/dashboard');
            } else {
                console.warn("Logged in, but user state doesn't allow access. Logging out.");
                logout();
            }
        } else {
            console.error("AuthContext: Login successful (token received), but failed to fetch user data.");
        }
    };

    return (
        <AuthContext.Provider value={{ user, token, isAuthenticated: !!token && !!user, isLoading, login, logout, fetchUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};