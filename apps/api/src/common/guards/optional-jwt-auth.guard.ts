import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { TokenVerifierService } from '../../auth/token-verifier.service';

@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  constructor(private readonly tokenVerifier: TokenVerifierService) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const header = request.headers?.authorization;
    const token = typeof header === 'string' && header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
      request.user = null;
      return true;
    }

    request.user = await this.tokenVerifier.verify(token);
    return true;
  }
}
