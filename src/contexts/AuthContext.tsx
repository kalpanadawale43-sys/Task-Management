import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthContextType } from '../types/auth';
import { generateId } from '../utils/helpers';
import { generateFakeData } from '../utils/fakeData';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Attempt to retrieve user from local storage only if explicitly requested
    const storedUser = localStorage.getItem('taskmaster_user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error("Error parsing user from localStorage:", error);
        // Handle the error appropriately, e.g., remove the invalid data
        localStorage.removeItem('taskmaster_user');
      }
    }
    setLoading(false);

    // Create demo user if it doesn't exist
    const demoUser = {
      id: 'demo-user-id',
      username: 'demo',
      password: 'password',
      startDate: new Date(),
      createdAt: new Date()
    };

    const users = JSON.parse(localStorage.getItem('taskmaster_users') || '[]');
    if (!users.find((u: User) => u.username === 'demo')) {
      users.push(demoUser);
      localStorage.setItem('taskmaster_users', JSON.stringify(users));

      // Simulate data for demo user
      simulateData(demoUser.id);
    }
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    const users = JSON.parse(localStorage.getItem('taskmaster_users') || '[]');
    const foundUser = users.find((u: User) => u.username === username && u.password === password);
    
    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem('taskmaster_user', JSON.stringify(foundUser));
      return true;
    }
    return false;
  };

  const register = async (username: string, password: string, startDate: string): Promise<boolean> => {
    const users = JSON.parse(localStorage.getItem('taskmaster_users') || '[]');
    
    if (users.find((u: User) => u.username === username)) {
      return false; // User already exists
    }

    const newUser: User = {
      id: generateId(),
      username,
      password,
      startDate: new Date(startDate),
      createdAt: new Date()
    };

    users.push(newUser);
    localStorage.setItem('taskmaster_users', JSON.stringify(users));
    
    setUser(newUser);
    localStorage.setItem('taskmaster_user', JSON.stringify(newUser));
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('taskmaster_user');
  };

  const updateUser = (updates: Partial<User>) => {
    if (!user) return;
    
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    localStorage.setItem('taskmaster_user', JSON.stringify(updatedUser));
    
    // Update in users array
    const users = JSON.parse(localStorage.getItem('taskmaster_users') || '[]');
    const userIndex = users.findIndex((u: User) => u.id === user.id);
    if (userIndex !== -1) {
      users[userIndex] = updatedUser;
      localStorage.setItem('taskmaster_users', JSON.stringify(users));
    }
  };

  const deleteAccount = () => {
    if (!user) return;
    
    const users = JSON.parse(localStorage.getItem('taskmaster_users') || '[]');
    const filteredUsers = users.filter((u: User) => u.id !== user.id);
    localStorage.setItem('taskmaster_users', JSON.stringify(filteredUsers));
    
    // Clear all user data
    localStorage.removeItem('taskmaster_user');
    localStorage.removeItem(`taskmaster_sessions_${user.id}`);
    localStorage.removeItem(`taskmaster_tasks_${user.id}`);
    localStorage.removeItem(`taskmaster_settings_${user.id}`);
    localStorage.removeItem(`taskmaster_leaves_${user.id}`);
    
    setUser(null);
  };

  // Simulate 14 days of data
  const simulateData = async (userId: string) => {
    const startDate = new Date();
    for (let i = 0; i < 14; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dateString = date.toISOString().split('T')[0];
      
      const { sessions, tasks } = generateFakeData(dateString);
      
      localStorage.setItem(`taskmaster_sessions_${userId}_${dateString}`, JSON.stringify(sessions));
      localStorage.setItem(`taskmaster_tasks_${userId}_${dateString}`, JSON.stringify(tasks));
    }
  };

  const value = {
    user,
    login,
    register,
    logout,
    updateUser,
    deleteAccount,
    loading,
    simulateData
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
