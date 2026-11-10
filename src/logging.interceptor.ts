import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    const method = request.method;
    const path = request.path;

    return next.handle().pipe(
      tap({
        next: () => {
          this.logger.log(`${method} ${path} ${response.statusCode}`);
        },
        error: (error: { status?: number }) => {
          const status = error.status ?? 500;
          this.logger.log(`${method} ${path} ${status}`);
        },
      }),
    );
  }
}
