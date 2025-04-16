import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { CollabGateway } from './collab.gateway';
import { CollabService } from './collab.service';

@Module({
  providers: [ChatGateway, CollabGateway, CollabService],
})
export class WebsocketModule {}
