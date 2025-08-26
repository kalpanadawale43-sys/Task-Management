export interface User {
  id: string;
  username: string;
  password: string;
  startDate: Date;
  createdAt: Date;
}

export interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, password: string, startDate: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  deleteAccount: () => void;
  loading: boolean;
}
