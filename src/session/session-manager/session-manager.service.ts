import { Injectable } from '@nestjs/common';
import { HumanMessage, AIMessage } from '@langchain/core/messages';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from 'src/prisma/prisma.service';
import { ChatMessageHistory } from 'langchain/stores/message/in_memory';
import { BaseChatMessageHistory } from '@langchain/core/chat_history';
@Injectable()
export class SessionManagerService {
  private sessions: Map<string, ChatMessageHistory>;
  private sidToSession: Map<string, string>;
  public readonly initialMessage: string;

  constructor(private readonly prismaService: PrismaService) {
    this.initialMessage = process.env.INITIAL_MESSAGE ?? 'Helllooo!';
    this.sessions = new Map();
    this.sidToSession = new Map();
  }

  // Cleanup logic for application shutdown
  async onApplicationShutdown(signal?: string): Promise<void> {
    console.log(`Application is shutting down... Signal: ${signal}`);
    try {
      this.sessions.clear();
      this.sidToSession.clear();
      console.log('In-memory session data cleared.');
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
    this.sessions.set(sessionId, new ChatMessageHistory());
    await this.sessions.get(sessionId)?.addAIMessage(this.initialMessage);
    await this.addMessageToPrisma(sessionId, this.initialMessage, 'ai');
    return ret.sessionId;
  }

  // Get the session's chat history
  getSessionHistory(sessionId: string): BaseChatMessageHistory {
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, new ChatMessageHistory());
    }
    const history = this.sessions.get(sessionId);
    return history;
  }

  // Map session ID from the sid
  getSessionIdFromSid(sid: string): string | undefined {
    return this.sidToSession.get(sid);
  }

  // Add a user's message to the session history
  async addUserMessage(sessionId: string, message: string): Promise<void> {
    const history = this.sessions.get(sessionId);
    if (history) {
      await history.addUserMessage(message);
    }
  }

  // Add the AI's message to the session history
  async addAIMessage(sessionId: string, message: string): Promise<void> {
    const history = this.sessions.get(sessionId);
    if (history) {
      await history.addAIMessage(message);
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

  async addSessionMessagesFromPrisma(
    sessionId: string,
  ): Promise<Record<string, string>[] | { error: string }> {
    const messages = await this.prismaService.langchain_chat_histories.findMany(
      {
        where: {
          session_id: sessionId,
        },
      },
    );
    if (messages.length === 0) {
      return { error: 'Session not found.' };
    }
    const serializedMessages = messages.map((msg) =>
      JSON.parse(msg.message.toString()),
    );
    const chat_history = new ChatMessageHistory();
    serializedMessages.map((msg) => {
      if (msg.type === 'ai') {
        chat_history.addAIMessage(msg.content);
      } else if (msg.type === 'human') {
        chat_history.addUserMessage(msg.content);
      } else {
        throw new TypeError(`Unknown message type: ${msg.type}`);
      }
    });
    this.sessions.set(sessionId, chat_history);
  }

  async addMessageToPrisma(
    sessionId: string,
    message: string,
    type: string,
  ): Promise<void> {
    if (type === 'ai') {
      const obj = {
        type: 'ai',
        content: message,
      };
      await this.prismaService.langchain_chat_histories.create({
        data: {
          session_id: sessionId,
          message: JSON.stringify(obj),
        },
      });
    } else if (type === 'human') {
      const obj = {
        type: 'human',
        content: message,
      };
      await this.prismaService.langchain_chat_histories.create({
        data: {
          session_id: sessionId,
          message: JSON.stringify(obj),
        },
      });
    } else {
      throw new TypeError(`Unknown message type: ${type}`);
    }
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
