import { Injectable } from '@nestjs/common';
import { HumanMessage, AIMessage } from '@langchain/core/messages';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from 'src/prisma/prisma.service';
import { PostgresChatMessageHistory } from '@langchain/community/stores/message/postgres';
import { Pool } from 'pg';

@Injectable()
export class SessionManagerService {
  private sessions: Map<string, PostgresChatMessageHistory>;
  private sidToSession: Map<string, string>;
  public readonly initialMessage: string;
  private posgresPool: Pool;

  constructor(private readonly prismaService: PrismaService) {
    this.initialMessage = process.env.INITIAL_MESSAGE ?? 'Helllooo!';
    this.sessions = new Map();
    this.sidToSession = new Map();
    this.posgresPool = new Pool({
      user: process.env.POSTGRES_USER,
      host: process.env.POSTGRES_HOST,
      database: process.env.POSTGRES_DB,
      password: process.env.POSTGRES_PASSWORD,
      port: parseInt(process.env.POSTGRES_PORT),
    });
  }

  // Cleanup logic for application shutdown
  async onApplicationShutdown(signal?: string): Promise<void> {
    console.log(`Application is shutting down... Signal: ${signal}`);
    try {
      this.sessions.clear();
      this.sidToSession.clear();
      console.log('In-memory session data cleared.');
      await this.posgresPool.end();
      console.log('Postgres pool closed successfully.');
    } catch (error) {
      console.error('Error during shutdown:', error);
    }
  }

  // Generate a unique session ID
  private generateSessionId(): string {
    return uuidv4();
  }

  // Create a new session and return the session ID
  async createSession(sid: string, userUuid: string): Promise<string> {
    const sessionId = this.generateSessionId();
    const ret = await this.prismaService.session.create({
      data: { userUuid, sessionId },
    });
    console.log('Session created');
    this.sidToSession.set(sid, sessionId);
    this.sessions.set(
      sessionId,
      new PostgresChatMessageHistory({ sessionId, pool: this.posgresPool }),
    );
    this.sessions.get(sessionId)?.addAIMessage(this.initialMessage);
    return ret.sessionId;
  }

  // Get the session's chat history
  getSessionHistory(sessionId: string): PostgresChatMessageHistory | undefined {
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(
        sessionId,
        new PostgresChatMessageHistory({ sessionId, pool: this.posgresPool }),
      );
    }
    const history = this.sessions.get(sessionId);
    return history;
  }

  // Map session ID from the sid
  getSessionIdFromSid(sid: string): string | undefined {
    return this.sidToSession.get(sid);
  }

  // Add a user's message to the session history
  addUserMessage(sessionId: string, message: string): void {
    const history = this.sessions.get(sessionId);
    if (history) {
      history.addUserMessage(message);
    }
  }

  // Add the AI's message to the session history
  addAIMessage(sessionId: string, message: string): void {
    const history = this.sessions.get(sessionId);
    if (history) {
      history.addAIMessage(message);
    }
  }

  // Delete a session by sessionId
  deleteSession(sessionId: string): boolean {
    if (this.sessions.has(sessionId)) {
      delete this.sessions[sessionId];
      return true;
    }
    return false;
  }

  async testIsSessionId(userUuid: string, sessionId: string): Promise<boolean> {
    const session = await this.prismaService.session.findUnique({
      where: {
        userUuid_sessionId: {
          userUuid,
          sessionId,
        },
      },
    });
    return session !== null;
  }

  mapSidToSession(sid: string, sessionId: string): void {
    this.sidToSession.set(sid, sessionId);
  }

  removeSidToSession(sid: string): void {
    this.sidToSession.delete(sid);
  }

  // Serialize a message for consistent structure
  private serializeMessage(
    message: AIMessage | HumanMessage,
  ): Record<string, string> {
    if (message instanceof AIMessage) {
      return {
        type: 'bot',
        content: message.content.toString(),
      };
    } else if (message instanceof HumanMessage) {
      return {
        type: 'user',
        content: message.content.toString(),
      };
    } else {
      throw new TypeError(`Unknown message type: ${message}`);
    }
  }

  // Retrieve serialized messages from a session
  async getSessionMessages(
    sessionId: string,
  ): Promise<Record<string, string>[] | { error: string }> {
    const history = this.getSessionHistory(sessionId);
    if (!history) {
      return { error: 'Session not found.' };
    }
    const messages = await history.getMessages();
    const serializedMessages = messages.map((msg) =>
      this.serializeMessage(msg),
    );
    return serializedMessages;
  }
}
