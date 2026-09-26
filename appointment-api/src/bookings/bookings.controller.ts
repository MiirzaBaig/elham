import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import { errorExamples } from '../common/swagger/error-examples';
import { ParseUuidPipe } from '../common/pipes/parse-uuid.pipe';
import { BookingsService } from './bookings.service';
import { BookingResponseDto } from './dto/booking.dto';
import { CreateBookingDto } from './dto/create-booking.dto';

@ApiTags('bookings')
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a booking for a slot',
    description:
      'Trims customerName and customerEmail. One active booking per slot; concurrent requests resolve to one 201 and one 409. No authentication.',
  })
  @ApiCreatedResponse({
    type: BookingResponseDto,
    description: 'Booking created with status active.',
  })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description: 'VALIDATION_ERROR — invalid/missing fields or malformed JSON.',
    content: { 'application/json': { examples: { validationError: errorExamples.validationError } } },
  })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
    description: 'SLOT_NOT_FOUND — valid UUID for a nonexistent slot.',
    content: { 'application/json': { examples: { slotNotFound: errorExamples.slotNotFound } } },
  })
  @ApiConflictResponse({
    type: ErrorResponseDto,
    description: 'SLOT_UNAVAILABLE — an active booking already exists for this slot.',
    content: { 'application/json': { examples: { slotUnavailable: errorExamples.slotUnavailable } } },
  })
  @ApiInternalServerErrorResponse({
    type: ErrorResponseDto,
    description: 'INTERNAL_ERROR',
    content: { 'application/json': { examples: { internalError: errorExamples.internalError } } },
  })
  async create(@Body() dto: CreateBookingDto): Promise<BookingResponseDto> {
    const booking = await this.bookingsService.create(dto);
    return { booking };
  }

  @Delete(':bookingId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cancel a booking',
    description:
      'Active bookings become cancelled and release the slot. Repeating cancellation returns 200 with the same cancelled booking and emits no Socket.IO event.',
  })
  @ApiParam({
    name: 'bookingId',
    format: 'uuid',
    example: '22222222-2222-4222-8222-222222222222',
  })
  @ApiOkResponse({
    type: BookingResponseDto,
    description:
      'Active booking becomes cancelled (slot released). Already cancelled bookings return the same payload without side effects.',
  })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description: 'VALIDATION_ERROR — bookingId is not a valid UUID.',
    content: { 'application/json': { examples: { validationError: errorExamples.validationError } } },
  })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
    description: 'BOOKING_NOT_FOUND',
    content: { 'application/json': { examples: { bookingNotFound: errorExamples.bookingNotFound } } },
  })
  @ApiInternalServerErrorResponse({
    type: ErrorResponseDto,
    description: 'INTERNAL_ERROR',
    content: { 'application/json': { examples: { internalError: errorExamples.internalError } } },
  })
  async cancel(
    @Param('bookingId', ParseUuidPipe) bookingId: string,
  ): Promise<BookingResponseDto> {
    const booking = await this.bookingsService.cancel(bookingId);
    return { booking };
  }
}
