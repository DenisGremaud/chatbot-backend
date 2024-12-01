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
  createUser() {
    return this.userService.createUser();
  }

  @Post('add-session')
  addSession(@Body() body: { user_uuid: string; session_id: string }) {
    const { user_uuid, session_id } = body;
    return this.userService.addSession(user_uuid, session_id);
  }

  @Get('sessions/:user_uuid')
  getSessions(@Param('user_uuid') user_uuid: string) {
    const result = this.userService.getSessions(user_uuid);

    if ('error' in result) {
      throw new HttpException(result.error, HttpStatus.NOT_FOUND);
    }

    return { session_ids: result };
  }

  @Get('all-users')
  getAllUsers() {
    return this.userService.getAllUsers();
  }

  @Get('exists/:user_uuid')
  userExists(@Param('user_uuid') user_uuid: string) {
    return this.userService.userExists(user_uuid);
  }
}
