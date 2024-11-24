import { Controller, Post, Body } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('query')
  async query(
    @Body('question') question: string,
  ): Promise<{ response: string }> {
    const response = await this.chatService.query(question);
    return { response };
  }
}
