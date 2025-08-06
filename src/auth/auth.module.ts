import { Module } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';

@Module({
  providers: [JwtStrategy],
  exports: [],
})
export class AuthModule {}
