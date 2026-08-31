import { Injectable } from "@nestjs/common";
import { ThrottlerGuard } from "@nestjs/throttler";

/**
 * Rate-limit key = req.ip, the client IP resolved by Express's `trust proxy`
 * setting. It is spoof-resistant here: Caddy appends the true peer as the last
 * X-Forwarded-For entry, and with `trust proxy = 1` Express reads exactly that.
 *
 * The default tracker uses `req.ips[0]` — the LEFTMOST X-Forwarded-For value,
 * which a client can set to anything. Behind a proxy that would let a caller
 * evade the limit with a fresh fake IP on every request.
 */
@Injectable()
export class ThrottlerBehindProxyGuard extends ThrottlerGuard {
  protected override getTracker(req: Record<string, unknown>): Promise<string> {
    return Promise.resolve(req["ip"] as string);
  }
}
