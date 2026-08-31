import { ApiProperty } from "@nestjs/swagger";
import { IsEmail } from "class-validator";
import type { CreateWaitlistEntry } from "@repo/types";

export class CreateWaitlistDto implements CreateWaitlistEntry {
  @ApiProperty({ example: "jane@example.com" })
  @IsEmail()
  email!: string;
}
