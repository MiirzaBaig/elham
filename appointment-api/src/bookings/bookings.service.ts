import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ApiException } from '../common/errors/api-error-code';
import { EventsService } from '../events/events.service';
import { PrismaService } from '../prisma/prisma.service';
import { toBookingDto } from './bookings.mapper';
import { BookingDto } from './dto/booking.dto';
import { CreateBookingDto } from './dto/create-booking.dto';

const ACTIVE_BOOKING_UNIQUE = 'bookings_one_active_per_slot';

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventsService,
  ) {}

  async create(dto: CreateBookingDto): Promise<BookingDto> {
    const slot = await this.prisma.slot.findUnique({
      where: { id: dto.slotId },
    });
    if (!slot) {
      throw new ApiException(
        'SLOT_NOT_FOUND',
        'No slot exists with this id.',
        404,
      );
    }

    try {
      const booking = await this.prisma.booking.create({
        data: {
          slotId: dto.slotId,
          customerName: dto.customerName,
          customerEmail: dto.customerEmail,
          status: 'active',
        },
      });

      this.events.emitSlotBooked(booking.slotId, booking.id);
      return toBookingDto(booking);
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002' &&
        (err.meta?.target as string[] | undefined)?.includes(
          ACTIVE_BOOKING_UNIQUE,
        )
      ) {
        throw new ApiException(
          'SLOT_UNAVAILABLE',
          'This slot already has an active booking.',
          409,
        );
      }
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new ApiException(
          'SLOT_UNAVAILABLE',
          'This slot already has an active booking.',
          409,
        );
      }
      throw err;
    }
  }

  async cancel(bookingId: string): Promise<BookingDto> {
    const existing = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });
    if (!existing) {
      throw new ApiException(
        'BOOKING_NOT_FOUND',
        'No booking exists with this id.',
        404,
      );
    }

    if (existing.status === 'cancelled') {
      return toBookingDto(existing);
    }

    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'cancelled',
        cancelledAt: new Date(),
      },
    });

    this.events.emitSlotReleased(updated.slotId, updated.id);
    return toBookingDto(updated);
  }
}
