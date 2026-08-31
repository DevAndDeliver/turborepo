import { Injectable, Logger } from "@nestjs/common";
import { Resend } from "resend";

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly resend: Resend | null;
  private readonly audienceId: string | null;

  // Placeholders — set MAIL_FROM, SITE_URL and SITE_NAME in apps/api/.env
  // before sending anything real. MAIL_FROM must be an address on a domain you
  // have verified with Resend, or every send is rejected. SITE_NAME is
  // optional: unset, the welcome email falls back to a name-free subject.
  private readonly mailFrom = process.env["MAIL_FROM"] ?? "Your Name <noreply@yourdomain.com>";
  private readonly siteUrl = process.env["SITE_URL"] ?? "https://yourdomain.com";
  private readonly siteName = process.env["SITE_NAME"] ?? "";

  private get siteHost(): string {
    try {
      return new URL(this.siteUrl).host;
    } catch {
      return this.siteUrl;
    }
  }

  constructor() {
    const apiKey = process.env["RESEND_API_KEY"];
    this.resend = apiKey ? new Resend(apiKey) : null;
    this.audienceId = process.env["RESEND_AUDIENCE_ID"] ?? null;

    if (!this.resend) {
      this.logger.warn("RESEND_API_KEY not set — email notifications disabled");
    } else if (!this.audienceId) {
      this.logger.warn("RESEND_AUDIENCE_ID not set — audience sync disabled");
    }
  }

  async addToAudience(email: string): Promise<boolean> {
    if (!this.resend || !this.audienceId) return false;
    const { error } = await this.resend.contacts.create({
      audienceId: this.audienceId,
      email,
    });
    if (error) {
      this.logger.error(`Failed to add ${email} to audience: ${error.message}`);
      return false;
    }
    return true;
  }

  async getAudienceCount(): Promise<number> {
    if (!this.resend || !this.audienceId) return 0;
    const { data, error } = await this.resend.contacts.list({ audienceId: this.audienceId });
    if (error || !data) return 0;
    return data.data.length;
  }

  sendWelcomeEmail(email: string): void {
    if (!this.resend) return;
    this.resend.emails
      .send({
        from: this.mailFrom,
        to: email,
        subject: this.siteName ? `You're subscribed — ${this.siteName}` : "You're subscribed",
        html: `
          <div style="font-family:monospace;max-width:480px;color:#18181b;padding:32px 0">
            <p style="margin:0 0 16px;font-size:20px;font-weight:700">You're subscribed.</p>
            <p style="margin:0 0 24px;color:#52525b;line-height:1.6">
              We'll notify you when new articles drop on
              <a href="${this.siteUrl}/blog" style="color:#10b981">${this.siteHost}</a>.
            </p>
            <p style="margin:0;font-size:12px;color:#a1a1aa">
              Don't want these? Reply with "unsubscribe" and we'll remove you.
            </p>
          </div>
        `,
        text: [
          "You're subscribed.",
          "",
          `We'll notify you when new articles drop at ${this.siteHost}/blog.`,
          "",
          "Don't want these? Reply with 'unsubscribe'.",
        ].join("\n"),
      })
      .then(() => this.logger.log(`Welcome email sent to ${email}`))
      .catch((err: Error) => this.logger.error(`Failed to send welcome email: ${err.message}`));
  }
}
