import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { User } from '../../modules/users/user.entity';

/**
 * Like AuthGuard('jwt'), but does NOT throw when the request has no token
 * or the token is invalid. Used for endpoints whose access depends on
 * per-resource flags (e.g. `section.isPublic`) — the controller decides
 * whether `req.user` being undefined is acceptable.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    try {
      await super.canActivate(ctx);
    } catch {
      /* swallow — handleRequest below returns user-or-undefined either way */
    }
    return true;
  }

  handleRequest<TUser = User>(
    _err: unknown,
    user: TUser | false | null,
  ): TUser | undefined {
    return user || undefined;
  }
}
