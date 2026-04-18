/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

import { template as reservationReminder } from './reservation-reminder.tsx'
import { template as reservationConfirmation } from './reservation-confirmation.tsx'
import { template as reservationCancellation } from './reservation-cancellation.tsx'
import { template as feedbackNotification } from './feedback-notification.tsx'
import { template as feedbackAcknowledgement } from './feedback-acknowledgement.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'reservation-reminder': reservationReminder,
  'reservation-confirmation': reservationConfirmation,
  'reservation-cancellation': reservationCancellation,
  'feedback-notification': feedbackNotification,
  'feedback-acknowledgement': feedbackAcknowledgement,
}
