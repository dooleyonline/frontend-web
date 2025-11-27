import { z } from "zod";

export const verificationJSONSchema = z.object({
	id: z.uuid(),
	user_id: z.uuid(),
	expired_at: z.string(),
});

export const verificationSchema = verificationJSONSchema.transform((data) => ({
	id: data.id,
	userID: data.user_id,
	expiredAt: new Date(data.expired_at),
}));

export type Verification = z.infer<typeof verificationSchema>;
