import { Injectable } from '@nestjs/common';
import { ChatMessageHistory } from 'langchain/stores/message/in_memory';
import { HumanMessage, AIMessage } from '@langchain/core/messages';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from 'src/prisma/prisma.service';

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

  // Generate a unique session ID
  private generateSessionId(): string {
    return uuidv4();
  }

  // Create a new session and return the session ID
  createSession(sid: string, userUuid: string): string {
    const sessionId = this.generateSessionId();
    this.sidToSession.set(sid, sessionId);
    this.sessions.set(sessionId, new ChatMessageHistory());
    this.sessions.get(sessionId)?.addAIMessage(this.initialMessage);
    return sessionId;
  }

  // Get the session's chat history
  getSessionHistory(sessionId: string): ChatMessageHistory | undefined {
    const history = this.sessions.get(sessionId);
    console.log(history);
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

  testIsSessionId(sessionId: string): boolean {
    return this.sessions.has(sessionId);
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
