import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChatModule } from './chat/chat.module';
import { ConfigModule } from '@nestjs/config';
import { SessionModule } from './session/session.module';
import { UserModule } from './user/user.module';
import { PrismaModule } from './prisma/prisma.module';
import { RetriverModule } from './retriver/retriver.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ChatModule,
    SessionModule,
    UserModule,
    PrismaModule,
    RetriverModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
