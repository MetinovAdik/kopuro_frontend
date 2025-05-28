import api from './api';
import { User } from '../contexts/AuthContext';


interface LoginResponse {
    access_token: string;
    token_type: string;
}

interface UserRegisterData {
    email: string;
    full_name?: string;
    password: string;
}

export const loginUser = async (email: string, password: string): Promise<{token: string}> => {
    const params = new URLSearchParams();
    params.append('username', email);
    params.append('password', password);

    const response = await api.post<LoginResponse>('/auth/token', params, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
    });
    return { token: response.data.access_token };
};

export const registerUser = async (data: UserRegisterData): Promise<User> => {
    const response = await api.post<User>('/auth/register', data);
    return response.data; // Возвращает созданного пользователя
};

export const getCurrentUser = async (): Promise<User> => {
    const response = await api.get<User>('/auth/users/me');
    return response.data;
};

export const getAllUsersForAdmin = async (skip: number = 0, limit: number = 100): Promise<User[]> => {
    const response = await api.get<User[]>(`/admin/users?skip=${skip}&limit=${limit}`);
    return response.data;
};

export const getUnconfirmedWorkersForAdmin = async (skip: number = 0, limit: number = 100): Promise<User[]> => {
    const response = await api.get<User[]>(`/admin/unconfirmed-workers?skip=${skip}&limit=${limit}`);
    return response.data;
};

export const confirmWorkerForAdmin = async (userId: number): Promise<User> => {
    const response = await api.patch<User>(`/admin/confirm-worker/${userId}`);
    return response.data;
};