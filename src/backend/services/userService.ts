import { z } from 'zod';

// Validation schemas
export const UserSchema = z.object({
  id: z.string().uuid().optional(),
  email: z.string().email(),
  name: z.string().min(2).max(100),
  age: z.number().min(18).max(150).optional(),
  createdAt: z.date().optional()
});

export type User = z.infer<typeof UserSchema>;

// In-memory storage for demo
const users: Map<string, User> = new Map();

export class UserService {
  async createUser(userData: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    // Validate input
    const validatedData = UserSchema.omit({ id: true, createdAt: true }).parse(userData);

    // Check for duplicate email
    const existingUser = Array.from(users.values()).find(
      u => u.email === validatedData.email
    );
    if (existingUser) {
      throw new Error('Email already exists');
    }

    // Create user
    const user: User = {
      ...validatedData,
      id: this.generateId(),
      createdAt: new Date()
    };

    users.set(user.id!, user);
    return user;
  }

  async getUserById(id: string): Promise<User | null> {
    return users.get(id) || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return Array.from(users.values()).find(u => u.email === email) || null;
  }

  async updateUser(id: string, updates: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<User> {
    const user = users.get(id);
    if (!user) {
      throw new Error('User not found');
    }

    const updatedUser = { ...user, ...updates };
    const validatedUser = UserSchema.parse(updatedUser);

    users.set(id, validatedUser);
    return validatedUser;
  }

  async deleteUser(id: string): Promise<boolean> {
    return users.delete(id);
  }

  async listUsers(): Promise<User[]> {
    return Array.from(users.values());
  }

  clearAll(): void {
    users.clear();
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const userService = new UserService();
