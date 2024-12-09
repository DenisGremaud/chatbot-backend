import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { SessionModule } from '../session/session.module'; // Import SessionModule
import { UserModule } from 'src/user/user.module';
import { RetriverModule } from 'src/retriver/retriver.module';
import { ChartToolsModule } from 'src/chart-tools/chart-tools.module';

@Module({
  imports: [SessionModule, UserModule, RetriverModule, ChartToolsModule], // Import SessionModule, UserModule, RetriverModule, and ChartToolsModule
  controllers: [ChatController], // Attach ChatController to the module
  providers: [ChatService, ChatGateway], // Provide ChatService and ChatGateway in the module
  exports: [ChatService], // Export ChatService to be used in other modules
})
export class ChatModule {}
