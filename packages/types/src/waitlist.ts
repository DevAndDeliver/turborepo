import { z } from "zod";

export const CreateWaitlistEntrySchema = z.object({
  email: z.string().email(),
});

export type CreateWaitlistEntry = z.infer<typeof CreateWaitlistEntrySchema>;
