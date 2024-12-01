import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UserService {
  // Array to store user UUIDs and their sessions
  private users: Map<string, string[]> = new Map();

  // Create a new user and initialize their session array
  createUser(): { user_uuid: string } {
    const user_uuid = uuidv4();
    this.users.set(user_uuid, []);
    return { user_uuid };
  }

  // Add a session ID to a user
  addSession(
    user_uuid: string,
    session_id: string,
  ): string | { error: string } {
    const user = this.users.get(user_uuid);

    if (!user) {
      return { error: 'User not found' };
    }

    user.push(session_id);
    return session_id;
  }

  // Get all session IDs for a user
  getSessions(user_uuid: string): string[] | { error: string } {
    const sessions = this.users.get(user_uuid);

    if (!sessions) {
      return { error: 'User not found or no sessions available' };
    }

    return sessions;
  }

  userExists(user_uuid: string): boolean {
    return this.users.has(user_uuid);
  }

  // Get all users and their sessions
  getAllUsers(): { user_uuid: string; session_ids: string[] }[] {
    return Array.from(this.users).map(([user_uuid, session_ids]) => ({
      user_uuid,
      session_ids: session_ids.slice(),
    }));
  }
}
