import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('create')
  async createUser() {
    return this.userService.createUser();
  }

  @Post('add-session')
  async addSession(@Body() body: { userUuid: string; sessionId: string }) {
    const { userUuid, sessionId } = body;
    return this.userService.addSession(userUuid, sessionId);
  }

  @Get('sessions/:userUuid')
  async getSessions(@Param('userUuid') userUuid: string) {
    const result = await this.userService.getSessions(userUuid);

    if ('error' in result) {
      throw new HttpException(result.error, HttpStatus.NOT_FOUND);
    }

    return { session_ids: result };
  }

  @Get('all-users')
  async getAllUsers() {
    return this.userService.getAllUsers();
  }

  @Get('exists/:userUuid')
  async userExists(@Param('userUuid') userUuid: string) {
    return this.userService.userExists(userUuid);
  }
}
