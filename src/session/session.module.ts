import { Module } from '@nestjs/common';
import { SessionManagerService } from './session-manager/session-manager.service';
import { SessionManagerController } from './session-manager/session-manager.controller';

@Module({
  providers: [SessionManagerService],
  controllers: [SessionManagerController],
  exports: [SessionManagerService], // Export the service to be used in other modules
})
export class SessionModule {}
