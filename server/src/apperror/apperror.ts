import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { log } from 'console';

interface AppError {
  message: string;
  stack: string;
  code: string;
  layer: string;
}

@Catch()
export class CustomExceptionFilter implements ExceptionFilter {
  catch(exception: AppError, host: ArgumentsHost) {
    log(exception.stack);
  }
}
