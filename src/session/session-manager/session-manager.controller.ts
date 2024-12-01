import { Controller, Post, Get, Param, Body, Delete } from '@nestjs/common';
import { SessionManagerService } from './session-manager.service';

@Controller('sessions') // Define a route prefix like /sessions
export class SessionManagerController {
  constructor(private readonly sessionManagerService: SessionManagerService) {}

  @Post('create')
  createSession(@Body('sid') sid: string): { sessionId: string } {
    const sessionId = this.sessionManagerService.createSession(sid);
    return { sessionId };
  }

  @Get('history/:sessionId')
  async getSessionHistory(@Param('sessionId') sessionId: string) {
    const history =
      await this.sessionManagerService.getSessionMessages(sessionId);
    if (!history) {
      return { error: 'Session not found' };
    }
    return { history };
  }

  @Delete(':sessionId')
  deleteSession(@Param('sessionId') sessionId: string): { success: boolean } {
    const success = this.sessionManagerService.deleteSession(sessionId);
    return { success };
  }
}
