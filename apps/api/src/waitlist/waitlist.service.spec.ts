import { describe, expect, it, vi } from "vitest";
import { WaitlistService } from "./waitlist.service";
import type { MailService } from "../mail/mail.service";

function createMailServiceMock(overrides: Partial<MailService> = {}): MailService {
  return {
    addToAudience: vi.fn().mockResolvedValue(true),
    sendWelcomeEmail: vi.fn(),
    getAudienceCount: vi.fn().mockResolvedValue(0),
    ...overrides,
  } as unknown as MailService;
}

describe("WaitlistService", () => {
  it("subscribes an email and sends a welcome email when added", async () => {
    const mail = createMailServiceMock();
    const service = new WaitlistService(mail);

    const result = await service.subscribe({ email: "jane@example.com" });

    expect(result).toEqual({ email: "jane@example.com" });
    expect(mail.addToAudience).toHaveBeenCalledWith("jane@example.com");
    expect(mail.sendWelcomeEmail).toHaveBeenCalledWith("jane@example.com");
  });

  it("skips the welcome email when the address was not added", async () => {
    const mail = createMailServiceMock({ addToAudience: vi.fn().mockResolvedValue(false) });
    const service = new WaitlistService(mail);

    await service.subscribe({ email: "jane@example.com" });

    expect(mail.sendWelcomeEmail).not.toHaveBeenCalled();
  });

  it("returns the current subscriber count", async () => {
    const mail = createMailServiceMock({ getAudienceCount: vi.fn().mockResolvedValue(42) });
    const service = new WaitlistService(mail);

    await expect(service.count()).resolves.toEqual({ count: 42 });
  });
});
