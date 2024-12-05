import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { SessionManagerService } from '../session/session-manager/session-manager.service';

@WebSocketGateway({
  cors: {
    origin: ['*'],
    credentials: false,
    methods: ['GET', 'POST', 'OPTIONS'],
    transports: ['websocket'],
  },
})
@Injectable()
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;
  useStream: boolean;

  constructor(
    private readonly chatService: ChatService,
    private readonly sessionManager: SessionManagerService,
  ) {
    this.useStream = process.env.USE_STREAM === 'true';
    console.log(`Using stream: ${this.useStream}`);
  }

  afterInit() {
    console.log('WebSocket Gateway Initialized');
  }

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
    client.emit('welcome', { message: 'Welcome to the WebSocket server!' });
  }

  async handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    const sessionId = this.sessionManager.getSessionIdFromSid(client.id);

    if (sessionId) {
      const history = this.sessionManager.getSessionHistory(sessionId);
      if (history) {
        console.log(
          `Session ${sessionId} disconnected. Saving session history.`,
        );
        // Add logic here to persist chat history if needed.
      }
      this.sessionManager.removeSidToSession(client.id);
    }
  }

  @SubscribeMessage('query')
  async handleQuery(
    @ConnectedSocket() client: Socket,
    @MessageBody('input') input: string,
    @MessageBody('sessionId') sessionId: string,
  ) {
    if (!sessionId || !this.sessionManager.getSessionHistory(sessionId)) {
      client.emit('error', { message: 'Invalid or missing session ID.' });
      return;
    }

    if (!input) {
      client.emit('error', { message: 'Input is required.' });
      return;
    }

    try {
      client.emit('response_start', true);

      if (this.useStream) {
        for await (const chunk of this.chatService.streamQuery(
          input,
          sessionId,
        )) {
          client.emit('response', chunk);
        }
      } else {
        const result = await this.chatService.query(input, sessionId);
        client.emit('response', result);
      }

      client.emit('response_end', true);
    } catch (error) {
      console.error('Error handling query:', error);
      client.emit('error', { message: 'Error processing the query.' });
    }
  }

  @SubscribeMessage('restore_session')
  async handleRestoreSession(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string; userUuid: string },
  ) {
    const { sessionId } = data;

    if (!sessionId) {
      client.emit('error', { message: 'Session ID is required.' });
      return;
    }

    try {
      if (this.sessionManager.testIsSessionId(sessionId)) {
        const messages =
          await this.sessionManager.getSessionMessages(sessionId);
        this.sessionManager.mapSidToSession(client.id, sessionId);
        client.emit('session_restored', { sessionId, chatHistory: messages });
      } else {
        const newSessionId = await this.sessionManager.createSession(
          client.id,
          data.userUuid,
        );
        client.emit('session_init', {
          sessionId: newSessionId,
          initialMessage: this.sessionManager.initialMessage,
        });
      }
    } catch (error) {
      console.error('Error restoring session:', error);
      client.emit('error', { message: 'Failed to restore session.' });
    }
  }

  @SubscribeMessage('init')
  async handleInit(
    @ConnectedSocket() client: Socket,
    @MessageBody('user_uuid') userUuid: string,
  ) {
    if (!userUuid) {
      client.emit('error', { message: 'User UUID is required.' });
      return;
    }

    try {
      const sessionId = this.sessionManager.createSession(client.id, userUuid);
      client.emit('session_init', {
        sessionId,
        initialMessage: this.sessionManager.initialMessage,
      });
    } catch (error) {
      console.error('Error initializing session:', error);
      client.emit('error', { message: 'Failed to initialize session.' });
    }
  }
}
