import { Injectable } from "@nestjs/common";
import { MailService } from "../mail/mail.service";
import { CreateWaitlistDto } from "./dto/create-waitlist.dto";

@Injectable()
export class WaitlistService {
  constructor(private readonly mail: MailService) {}

  async subscribe(dto: CreateWaitlistDto): Promise<{ email: string }> {
    const added = await this.mail.addToAudience(dto.email);
    if (added) this.mail.sendWelcomeEmail(dto.email);
    return { email: dto.email };
  }

  async count(): Promise<{ count: number }> {
    return { count: await this.mail.getAudienceCount() };
  }
}
