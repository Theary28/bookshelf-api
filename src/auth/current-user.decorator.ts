import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export type JwtPayload = { sub: number; email: string };

// Reads the payload AuthGuard attached to the request.
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): JwtPayload =>
    context.switchToHttp().getRequest().user,
);
