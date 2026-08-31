import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { WaitlistService } from "./waitlist.service";
import { CreateWaitlistDto } from "./dto/create-waitlist.dto";

@ApiTags("waitlist")
@Controller("waitlist")
export class WaitlistController {
  constructor(private readonly waitlistService: WaitlistService) {}

  @Post()
  @HttpCode(200)
  @ApiOperation({ summary: "Subscribe to the series" })
  @ApiResponse({ status: 200, description: "Subscribed successfully" })
  @ApiResponse({ status: 400, description: "Invalid email address" })
  subscribe(@Body() dto: CreateWaitlistDto): Promise<{ email: string }> {
    return this.waitlistService.subscribe(dto);
  }

  @Get("count")
  @ApiOperation({ summary: "Get subscriber count" })
  @ApiResponse({ status: 200, description: "Current subscriber count" })
  count(): Promise<{ count: number }> {
    return this.waitlistService.count();
  }
}
