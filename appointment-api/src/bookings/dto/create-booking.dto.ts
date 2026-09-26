import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsUUID, MaxLength } from 'class-validator';

export class CreateBookingDto {
  @ApiProperty({
    format: 'uuid',
    example: '11111111-1111-4111-8111-111111111111',
  })
  @IsUUID('4', { message: 'slotId must be a valid UUID.' })
  slotId!: string;

  @ApiProperty({ example: 'Alex Morgan' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsNotEmpty({ message: 'customerName must not be empty.' })
  @MaxLength(200)
  customerName!: string;

  @ApiProperty({ example: 'alex@example.com' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsEmail({}, { message: 'customerEmail must be a valid email address.' })
  @MaxLength(320)
  customerEmail!: string;
}
