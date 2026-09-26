import { DynamicModule, Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { existsSync } from 'fs';
import { join } from 'path';

@Module({})
export class DemoStaticModule {
  static register(): DynamicModule {
    const rootPath = join(process.cwd(), 'demo-ui', 'dist');
    const hasBuild = existsSync(join(rootPath, 'index.html'));

    if (!hasBuild) {
      return { module: DemoStaticModule, imports: [], providers: [], exports: [] };
    }

    return {
      module: DemoStaticModule,
      imports: [
        ServeStaticModule.forRoot({
          rootPath,
          serveRoot: '/demo',
          exclude: [
            '/slots',
            '/slots/(.*)',
            '/bookings',
            '/bookings/(.*)',
            '/docs',
            '/docs/(.*)',
            '/openapi.json',
            '/socket.io',
            '/socket.io/(.*)',
          ],
        }),
      ],
    };
  }
}
