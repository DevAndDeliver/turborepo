import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockCreate, mockList, mockSend } = vi.hoisted(() => ({
  mockCreate: vi.fn(),
  mockList: vi.fn(),
  mockSend: vi.fn(),
}));

vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(function MockResend() {
    return {
      contacts: { create: mockCreate, list: mockList },
      emails: { send: mockSend },
    };
  }),
}));

import { MailService } from "./mail.service";

describe("MailService", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("without RESEND_API_KEY", () => {
    beforeEach(() => {
      delete process.env["RESEND_API_KEY"];
    });

    it("addToAudience is a no-op and returns false", async () => {
      const service = new MailService();
      await expect(service.addToAudience("jane@example.com")).resolves.toBe(false);
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it("getAudienceCount returns 0 without calling Resend", async () => {
      const service = new MailService();
      await expect(service.getAudienceCount()).resolves.toBe(0);
      expect(mockList).not.toHaveBeenCalled();
    });

    it("sendWelcomeEmail does not call the Resend API", () => {
      const service = new MailService();
      service.sendWelcomeEmail("jane@example.com");
      expect(mockSend).not.toHaveBeenCalled();
    });
  });

  describe("with RESEND_API_KEY but no RESEND_AUDIENCE_ID", () => {
    beforeEach(() => {
      process.env["RESEND_API_KEY"] = "re_test_key";
      delete process.env["RESEND_AUDIENCE_ID"];
    });

    it("addToAudience still returns false", async () => {
      const service = new MailService();
      await expect(service.addToAudience("jane@example.com")).resolves.toBe(false);
      expect(mockCreate).not.toHaveBeenCalled();
    });
  });

  describe("with RESEND_API_KEY and RESEND_AUDIENCE_ID", () => {
    beforeEach(() => {
      process.env["RESEND_API_KEY"] = "re_test_key";
      process.env["RESEND_AUDIENCE_ID"] = "audience_123";
    });

    it("addToAudience returns true and calls Resend with the right payload", async () => {
      mockCreate.mockResolvedValue({ data: {}, error: null });
      const service = new MailService();
      await expect(service.addToAudience("jane@example.com")).resolves.toBe(true);
      expect(mockCreate).toHaveBeenCalledWith({
        audienceId: "audience_123",
        email: "jane@example.com",
      });
    });

    it("addToAudience returns false when Resend responds with an error", async () => {
      mockCreate.mockResolvedValue({ data: null, error: { message: "boom" } });
      const service = new MailService();
      await expect(service.addToAudience("jane@example.com")).resolves.toBe(false);
    });

    it("getAudienceCount returns the contact count from Resend", async () => {
      mockList.mockResolvedValue({ data: { data: [{}, {}, {}] }, error: null });
      const service = new MailService();
      await expect(service.getAudienceCount()).resolves.toBe(3);
    });

    it("getAudienceCount returns 0 when Resend responds with an error", async () => {
      mockList.mockResolvedValue({ data: null, error: { message: "boom" } });
      const service = new MailService();
      await expect(service.getAudienceCount()).resolves.toBe(0);
    });

    it("sendWelcomeEmail calls Resend with the recipient address", () => {
      mockSend.mockResolvedValue({ data: {}, error: null });
      const service = new MailService();
      service.sendWelcomeEmail("jane@example.com");
      expect(mockSend).toHaveBeenCalledWith(expect.objectContaining({ to: "jane@example.com" }));
    });

    describe("branding via env", () => {
      beforeEach(() => {
        mockSend.mockResolvedValue({ data: {}, error: null });
        delete process.env["MAIL_FROM"];
        delete process.env["SITE_URL"];
        delete process.env["SITE_NAME"];
      });

      it("falls back to the built-in defaults when nothing is set", () => {
        new MailService().sendWelcomeEmail("jane@example.com");
        const payload = mockSend.mock.calls[0]?.[0];
        expect(payload.from).toBe("Your Name <noreply@yourdomain.com>");
        // SITE_NAME defaults to blank, so the subject carries no suffix.
        expect(payload.subject).toBe("You're subscribed");
        expect(payload.html).toContain("https://yourdomain.com/blog");
        expect(payload.text).toContain("yourdomain.com/blog");
      });

      it("uses MAIL_FROM, SITE_URL and SITE_NAME when set", () => {
        process.env["MAIL_FROM"] = "Acme <noreply@acme.dev>";
        process.env["SITE_URL"] = "https://acme.dev";
        process.env["SITE_NAME"] = "Acme";
        new MailService().sendWelcomeEmail("jane@example.com");
        const payload = mockSend.mock.calls[0]?.[0];
        expect(payload.from).toBe("Acme <noreply@acme.dev>");
        expect(payload.subject).toBe("You're subscribed — Acme");
        expect(payload.html).toContain('href="https://acme.dev/blog"');
        expect(payload.html).toContain(">acme.dev</a>");
        expect(payload.text).toContain("acme.dev/blog");
      });

      it("omits the subject suffix when SITE_NAME is blank", () => {
        process.env["SITE_URL"] = "https://acme.dev";
        process.env["SITE_NAME"] = "";
        new MailService().sendWelcomeEmail("jane@example.com");
        expect(mockSend.mock.calls[0]?.[0].subject).toBe("You're subscribed");
      });

      it("falls back to the raw value when SITE_URL is not a valid URL", () => {
        process.env["SITE_URL"] = "not-a-url";
        new MailService().sendWelcomeEmail("jane@example.com");
        expect(mockSend.mock.calls[0]?.[0].text).toContain("not-a-url/blog");
      });
    });
  });
});
