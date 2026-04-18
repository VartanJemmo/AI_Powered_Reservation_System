import * as React from 'npm:react@18.3.1'
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
  Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Mayrig'

interface FeedbackAcknowledgementProps {
  name?: string
  feedbackType?: 'praise' | 'complaint'
}

const FeedbackAcknowledgementEmail = ({
  name,
  feedbackType,
}: FeedbackAcknowledgementProps) => {
  const isComplaint = feedbackType === 'complaint'
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>Thank you for your feedback — {SITE_NAME}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={brand}>{SITE_NAME}</Heading>
          <Hr style={goldRule} />
          <Heading as="h2" style={h1}>
            {name ? `Thank you, ${name}` : 'Thank you for sharing'}
          </Heading>
          <Text style={text}>
            {isComplaint
              ? `We're truly sorry your visit didn't meet your expectations. Your message has reached our manager directly and we'll be in touch personally to make it right.`
              : `It means the world to us that you took a moment to share your experience. We've passed your kind words to our team — they'll be smiling all evening.`}
          </Text>
          <Text style={text}>
            We hope to welcome you back to {SITE_NAME} very soon.
          </Text>
          <Text style={footer}>Warmly,<br />The {SITE_NAME} team</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: FeedbackAcknowledgementEmail,
  subject: `Thank you for your feedback — ${SITE_NAME}`,
  displayName: 'Feedback acknowledgement',
  previewData: { name: 'Ani', feedbackType: 'praise' },
} satisfies TemplateEntry

const main = {
  backgroundColor: '#ffffff',
  fontFamily: '"Fira Sans", Helvetica, Arial, sans-serif',
}
const container = { padding: '32px 28px', maxWidth: '560px', margin: '0 auto' }
const brand = {
  fontFamily: '"DM Serif Display", Georgia, serif',
  fontSize: '32px',
  color: '#1a1410',
  margin: '0 0 12px',
  letterSpacing: '0.02em',
}
const goldRule = { border: 'none', borderTop: '2px solid #c9a84c', width: '48px', margin: '0 0 24px' }
const h1 = {
  fontFamily: '"DM Serif Display", Georgia, serif',
  fontSize: '24px',
  color: '#1a1410',
  margin: '0 0 16px',
  fontWeight: 'normal' as const,
}
const text = { fontSize: '15px', color: '#3d362f', lineHeight: '1.6', margin: '0 0 20px' }
const footer = { fontSize: '13px', color: '#8a7a55', margin: '24px 0 0' }
