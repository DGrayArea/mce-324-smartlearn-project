// Authentication and user management with localStorage
export type UserRole = "student" | "lecturer" | "admin";

export interface User {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  department?: string;
  studentId?: string;
  staffId?: string;
  isVerified: boolean;
  createdAt: string;
  lastLogin?: string;
  isActive?: boolean;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

class AuthService {
  private static readonly USERS_KEY = "learning_platform_users";
  private static readonly CURRENT_USER_KEY = "learning_platform_current_user";

  // Initialize with dummy data
  static initializeDummyData() {
    const existingUsers = this.getUsers();
    if (existingUsers.length === 0) {
      const dummyUsers: User[] = [
        {
          id: "1",
          email: "student@demo.com",
          password: "password123",
          firstName: "Alice",
          lastName: "Johnson",
          role: "student",
          department: "Computer Science",
          studentId: "CS2024001",
          isVerified: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: "2",
          email: "lecturer@demo.com",
          password: "password123",
          firstName: "Dr. Robert",
          lastName: "Smith",
          role: "lecturer",
          department: "Computer Science",
          staffId: "LEC001",
          isVerified: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: "3",
          email: "admin@demo.com",
          password: "password123",
          firstName: "Sarah",
          lastName: "Wilson",
          role: "admin",
          staffId: "ADM001",
          isVerified: true,
          createdAt: new Date().toISOString(),
        },
      ];
      this.saveUsers(dummyUsers);
    }
  }

  static getUsers(): User[] {
    const users = localStorage.getItem(this.USERS_KEY);
    return users ? JSON.parse(users) : [];
  }

  static saveUsers(users: User[]) {
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
  }

  static getCurrentUser(): User | null {
    const user = localStorage.getItem(this.CURRENT_USER_KEY);
    return user ? JSON.parse(user) : null;
  }

  static setCurrentUser(user: User | null) {
    if (user) {
      localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(this.CURRENT_USER_KEY);
    }
  }

  static async login(
    email: string,
    password: string
  ): Promise<{ success: boolean; user?: User; error?: string }> {
    const users = this.getUsers();
    const user = users.find(
      (u) => u.email === email && u.password === password
    );

    if (user) {
      // Update last login
      user.lastLogin = new Date().toISOString();
      const updatedUsers = users.map((u) => (u.id === user.id ? user : u));
      this.saveUsers(updatedUsers);
      this.setCurrentUser(user);

      return { success: true, user };
    }

    return { success: false, error: "Invalid email or password" };
  }

  static async register(
    userData: Omit<User, "id" | "createdAt" | "isVerified">
  ): Promise<{ success: boolean; user?: User; error?: string }> {
    const users = this.getUsers();

    // Check if email already exists
    if (users.find((u) => u.email === userData.email)) {
      return { success: false, error: "Email already exists" };
    }

    const newUser: User = {
      ...userData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      isVerified: false,
    };

    users.push(newUser);
    this.saveUsers(users);

    return { success: true, user: newUser };
  }

  static async resetPassword(
    email: string
  ): Promise<{ success: boolean; error?: string }> {
    const users = this.getUsers();
    const user = users.find((u) => u.email === email);

    if (!user) {
      return { success: false, error: "Email not found" };
    }

    // In a real app, this would send an email
    // For demo purposes, we'll just reset to a default password
    user.password = "newpassword123";
    const updatedUsers = users.map((u) => (u.id === user.id ? user : u));
    this.saveUsers(updatedUsers);

    return { success: true };
  }

  static async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> {
    const users = this.getUsers();
    const user = users.find((u) => u.id === userId);

    if (!user) {
      return { success: false, error: "User not found" };
    }

    if (user.password !== currentPassword) {
      return { success: false, error: "Current password is incorrect" };
    }

    user.password = newPassword;
    const updatedUsers = users.map((u) => (u.id === user.id ? user : u));
    this.saveUsers(updatedUsers);
    this.setCurrentUser(user);

    return { success: true };
  }

  static logout() {
    this.setCurrentUser(null);
  }

  static isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }
}

export default AuthService;
