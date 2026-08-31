import { Module } from "@nestjs/common";
import { ThrottlerModule } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { WaitlistModule } from "./waitlist/waitlist.module";
import { ThrottlerBehindProxyGuard } from "./throttler-behind-proxy.guard";

@Module({
  imports: [ThrottlerModule.forRoot([{ ttl: 60000, limit: 10 }]), WaitlistModule],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerBehindProxyGuard }],
})
export class AppModule {}
