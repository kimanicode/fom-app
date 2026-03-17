import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TokenVerifierService } from './token-verifier.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, TokenVerifierService],
  exports: [TokenVerifierService, AuthService],
})
export class AuthModule {}
