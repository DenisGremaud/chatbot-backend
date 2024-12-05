import { Module } from '@nestjs/common';
import { SessionManagerService } from './session-manager/session-manager.service';
import { SessionManagerController } from './session-manager/session-manager.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [SessionManagerService],
  controllers: [SessionManagerController],
  exports: [SessionManagerService], // Export the service to be used in other modules
})
export class SessionModule {}
