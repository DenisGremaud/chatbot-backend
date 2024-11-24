import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';

@Module({
  controllers: [ChatController], // Attach ChatController to the module
  providers: [ChatService, ChatGateway], // Provide ChatService in the module
  exports: [ChatService], // Export ChatService to be used in other modules
})
export class ChatModule {}
