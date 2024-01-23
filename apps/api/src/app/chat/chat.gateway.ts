import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { ChatAudio, ChatCall, Events } from './chat.model';
import * as events from 'events';

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection {
  @WebSocketServer()
  private readonly server: Server;
  private readonly logger: Logger;

  constructor(private readonly chatService: ChatService) {
    this.logger = new Logger(ChatGateway.name);
  }

  async handleConnection() {}

  @SubscribeMessage(Events.SendMessage)
  async listenForMessages(
    @MessageBody() request: ChatCall,
    @ConnectedSocket() socket: Socket,
  ) {
    this.logger.log(`Socket "${Events.SendMessage}" (${socket.id}):
    * thread: ${request.threadId}
    * content: ${request.content}`);

    const message = await this.chatService.call(request);

    this.server.to(socket.id).emit(Events.MessageReceived, message);
    this.logger.log(`Socket "${Events.MessageReceived}" (${socket.id}):
    * thread: ${message.threadId}
    * content: ${message.content}`);
  }

  @SubscribeMessage(Events.SendAudio)
  async listenForAudio(
    @MessageBody() request: ChatAudio,
    @ConnectedSocket() socket: Socket,
  ) {
    this.logger.log(`Socket "${Events.SendAudio}" (${socket.id}):
    * thread: ${request.threadId}
    * file: ${request.filename}`);

    const message = await this.chatService.transcription(request);

    this.server.to(socket.id).emit(Events.MessageReceived, message);
    this.logger.log(`Socket "${Events.AudioReceived}" (${socket.id}):
    * thread: ${message.threadId}
    * file: ${message.content}`);
  }
}