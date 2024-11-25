import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChatModule } from './chat/chat.module';
import { ConfigModule } from '@nestjs/config';
import { SessionModule } from './session/session.module';

@Module({
  imports: [ConfigModule.forRoot(), ChatModule, SessionModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
