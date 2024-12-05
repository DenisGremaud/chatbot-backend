import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  // Create a new user
  async createUser(): Promise<{ user_uuid: string }> {
    const user = await this.prisma.user.create({
      data: { uuid: uuidv4() },
    });
    return { user_uuid: user.uuid };
  }

  // Add a session for a user
  async addSession(
    userUuid: string,
    sessionId: string,
  ): Promise<string | { error: string }> {
    const user = await this.prisma.user.findUnique({
      where: { uuid: userUuid },
    });

    if (!user) {
      return { error: 'User not found' };
    }

    await this.prisma.session.create({
      data: { userUuid, sessionId },
    });

    return sessionId;
  }

  // Get all sessions for a user
  async getSessions(userUuid: string): Promise<string[] | { error: string }> {
    const sessions = await this.prisma.session.findMany({
      where: { userUuid },
      select: { sessionId: true },
    });

    if (!sessions.length) {
      return { error: 'No sessions found for the user.' };
    }
    const session_ids = sessions.map((session) => session.sessionId);
    console.log(session_ids);
    return sessions.map((session) => session.sessionId);
  }

  // Check if a user exists
  async userExists(userUuid: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { uuid: userUuid },
    });
    return !!user;
  }

  // Get all users and their sessions
  async getAllUsers(): Promise<{ user_uuid: string; session_ids: string[] }[]> {
    const users = await this.prisma.user.findMany({
      include: { sessions: true },
    });

    return users.map((user) => ({
      user_uuid: user.uuid,
      session_ids: user.sessions.map((session) => session.sessionId),
    }));
  }
}
