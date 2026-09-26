import { PipeTransform } from '@nestjs/common';
import { ApiException } from '../errors/api-error-code';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class ParseUuidPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (typeof value !== 'string' || !UUID_RE.test(value)) {
      throw new ApiException(
        'VALIDATION_ERROR',
        'bookingId must be a valid UUID.',
        400,
      );
    }
    return value;
  }
}
