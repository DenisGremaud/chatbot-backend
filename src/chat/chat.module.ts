import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { SessionModule } from '../session/session.module'; // Import SessionModule

@Module({
  imports: [SessionModule], // Add SessionModule to imports
  controllers: [ChatController], // Attach ChatController to the module
  providers: [ChatService, ChatGateway], // Provide ChatService and ChatGateway in the module
  exports: [ChatService], // Export ChatService to be used in other modules
})
export class ChatModule {}
