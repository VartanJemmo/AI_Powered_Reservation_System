import { supabase } from "@/integrations/supabase/client";

export type FeedbackType = "praise" | "complaint";

export interface FeedbackInput {
  guestName: string;
  guestEmail?: string;
  guestPhone?: string;
  feedbackType: FeedbackType;
  rating: number;
  message: string;
}

// Restaurant inbox that receives every guest feedback notification.
// Update here if the manager's address changes.
export const RESTAURANT_INBOX = "hello@mayrig.com";

export async function submitFeedback(input: FeedbackInput) {
  const id = crypto.randomUUID();

  const { error } = await supabase.from("feedback").insert({
    id,
    guest_name: input.guestName.trim(),
    guest_email: input.guestEmail?.trim() || null,
    guest_phone: input.guestPhone?.trim() || null,
    feedback_type: input.feedbackType,
    rating: input.rating,
    message: input.message.trim(),
  });

  if (error) throw error;

  // Notify the restaurant — fire and forget, don't block the user on it.
  void supabase.functions.invoke("send-transactional-email", {
    body: {
      templateName: "feedback-notification",
      recipientEmail: RESTAURANT_INBOX,
      idempotencyKey: `feedback-notify-${id}`,
      templateData: {
        guestName: input.guestName,
        guestEmail: input.guestEmail || null,
        guestPhone: input.guestPhone || null,
        feedbackType: input.feedbackType,
        rating: input.rating,
        message: input.message,
        submittedAt: new Date().toISOString(),
      },
    },
  });

  // Acknowledge the guest if they shared an email
  if (input.guestEmail) {
    void supabase.functions.invoke("send-transactional-email", {
      body: {
        templateName: "feedback-acknowledgement",
        recipientEmail: input.guestEmail.trim(),
        idempotencyKey: `feedback-ack-${id}`,
        templateData: {
          name: input.guestName.split(" ")[0],
          feedbackType: input.feedbackType,
        },
      },
    });
  }

  return { id };
}
