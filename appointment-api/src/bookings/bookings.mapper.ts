import { Booking } from '@prisma/client';
import { BookingDto } from './dto/booking.dto';

export function toBookingDto(booking: Booking): BookingDto {
  return {
    id: booking.id,
    slotId: booking.slotId,
    customerName: booking.customerName,
    customerEmail: booking.customerEmail,
    status: booking.status,
  };
}
