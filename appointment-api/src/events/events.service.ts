import { Injectable } from '@nestjs/common';
import { EventsGateway } from './events.gateway';

@Injectable()
export class EventsService {
  constructor(private readonly gateway: EventsGateway) {}

  emitSlotBooked(slotId: string, bookingId: string) {
    this.gateway.server.emit('slot.booked', {
      slotId,
      bookingId,
      available: false,
    });
  }

  emitSlotReleased(slotId: string, bookingId: string) {
    this.gateway.server.emit('slot.released', {
      slotId,
      bookingId,
      available: true,
    });
  }
}
