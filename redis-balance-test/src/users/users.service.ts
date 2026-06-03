import { Injectable } from '@nestjs/common';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  private readonly users = new Map<string, User>();

  constructor() {
    // Seed default mock users for testing
    this.seedMockUsers();
  }

  private seedMockUsers() {
    const mockUsers: User[] = [
      { id: 'user-1', username: 'player_one', email: 'player_one@example.com', currency: 'USD' },
      { id: 'user-2', username: 'player_two', email: 'player_two@example.com', currency: 'USD' },
    ];

    for (const user of mockUsers) {
      this.users.set(user.id, user);
    }
  }

  async findOne(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async findAll(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async exists(id: string): Promise<boolean> {
    return this.users.has(id);
  }
}
