import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { AuthentikService } from './authentik.service';

@Module({
  controllers: [UsersController],
  providers: [AuthentikService],
  exports: [AuthentikService],
})
export class UsersModule {}
