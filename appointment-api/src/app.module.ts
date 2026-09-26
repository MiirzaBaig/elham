import { Module } from '@nestjs/common';
import { BookingsModule } from './bookings/bookings.module';
import { DemoStaticModule } from './demo-static.module';
import { EventsModule } from './events/events.module';
import { PrismaModule } from './prisma/prisma.module';
import { SlotsModule } from './slots/slots.module';

@Module({
  imports: [
    DemoStaticModule.register(),
    PrismaModule,
    SlotsModule,
    BookingsModule,
    EventsModule,
  ],
})
export class AppModule {}
