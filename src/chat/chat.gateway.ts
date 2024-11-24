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

@WebSocketGateway({
  cors: {
    origin: '*', // Update this with your client origin
  },
})
@Injectable()
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;
  useStream: boolean;

  constructor(private readonly chatService: ChatService) {
    this.useStream = process.env.USE_STREAM === 'true';
    console.log(`Using stream: ${this.useStream}`);
  }

  afterInit() {
    console.log('WebSocket Gateway Initialized');
  }

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('query')
  async handleQuery(
    @ConnectedSocket() client: Socket,
    @MessageBody('input') input: any,
  ) {
    console.log('Received input:', input);
    if (!input) {
      client.emit('error', { message: 'Input is required' });
      return;
    }

    client.emit('response', `Received input: ${input}`);

    if (this.useStream) {
      client.emit('response_start', true);
      const stream = await this.chatService.streamQuery(input);

      for await (const chunk of stream) {
        console.log('Emitting chunk:', chunk);
        client.emit('response', chunk); // Emit each chunk to the client
      }

      client.emit('response_end', true);
    } else {
      const result = await this.chatService.query(input);
      client.emit('response', result);
      client.emit('response_end', true);
    }
  }
}
