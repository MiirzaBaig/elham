import { ApiProperty } from '@nestjs/swagger';

export class ErrorBodyDto {
  @ApiProperty({
    enum: [
      'VALIDATION_ERROR',
      'SLOT_NOT_FOUND',
      'SLOT_UNAVAILABLE',
      'BOOKING_NOT_FOUND',
      'INTERNAL_ERROR',
    ],
  })
  code!: string;

  @ApiProperty({ example: 'This slot already has an active booking.' })
  message!: string;
}

export class ErrorResponseDto {
  @ApiProperty({ type: ErrorBodyDto })
  error!: ErrorBodyDto;
}
