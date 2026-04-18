import * as React from 'npm:react@18.3.1'
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Mayrig'

interface FeedbackNotificationProps {
  guestName?: string
  guestEmail?: string
  guestPhone?: string
  feedbackType?: 'praise' | 'complaint'
  rating?: number
  message?: string
  submittedAt?: string
}

const stars = (rating?: number) => {
  if (!rating) return '—'
  return '★'.repeat(rating) + '☆'.repeat(Math.max(0, 5 - rating))
}

const formatWhen = (iso?: string) => {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleString('en-US', {
      weekday: 'short',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

const FeedbackNotificationEmail = ({
  guestName,
  guestEmail,
  guestPhone,
  feedbackType,
  rating,
  message,
  submittedAt,
}: FeedbackNotificationProps) => {
  const isComplaint = feedbackType === 'complaint'
  const headline = isComplaint ? 'New complaint received' : 'New positive feedback'
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>
        {`${headline} from ${guestName || 'a guest'} — ${rating || '?'}/5 stars`}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={brand}>{SITE_NAME}</Heading>
          <Hr style={isComplaint ? redRule : goldRule} />
          <Heading as="h2" style={h1}>{headline}</Heading>
          <Text style={text}>
            {isComplaint
              ? 'A guest has shared a concern about their experience. Please review and follow up promptly.'
              : 'A guest has shared positive feedback about their visit.'}
          </Text>

          <Section style={isComplaint ? cardAlert : card}>
            <Text style={cardLabel}>Rating</Text>
            <Text style={ratingStyle}>{stars(rating)} {rating ? `(${rating}/5)` : ''}</Text>

            <Text style={cardLabel}>Type</Text>
            <Text style={cardValue}>{isComplaint ? 'Complaint' : 'Praise'}</Text>

            <Text style={cardLabel}>Guest</Text>
            <Text style={cardValue}>{guestName || '—'}</Text>

            {guestEmail && (
              <>
                <Text style={cardLabel}>Email</Text>
                <Text style={cardValue}>{guestEmail}</Text>
              </>
            )}

            {guestPhone && (
              <>
                <Text style={cardLabel}>Phone</Text>
                <Text style={cardValue}>{guestPhone}</Text>
              </>
            )}

            <Text style={cardLabel}>Message</Text>
            <Text style={messageStyle}>{message || '—'}</Text>

            {submittedAt && (
              <>
                <Text style={cardLabel}>Submitted</Text>
                <Text style={cardValue}>{formatWhen(submittedAt)}</Text>
              </>
            )}
          </Section>

          <Text style={footer}>Sent automatically from the {SITE_NAME} website.</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: FeedbackNotificationEmail,
  subject: (data: Record<string, any>) => {
    const type = data?.feedbackType === 'complaint' ? 'Complaint' : 'Positive feedback'
    const rating = data?.rating ? ` · ${data.rating}/5` : ''
    return `[${SITE_NAME}] ${type}${rating} from ${data?.guestName || 'a guest'}`
  },
  displayName: 'Guest feedback notification',
  previewData: {
    guestName: 'Ani Sarkissian',
    guestEmail: 'ani@example.com',
    guestPhone: '+961 70 123 456',
    feedbackType: 'praise',
    rating: 5,
    message: 'The lahmajoun was unreal and our server Karen made the night.',
    submittedAt: new Date().toISOString(),
  },
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
const redRule = { border: 'none', borderTop: '2px solid #b3261e', width: '48px', margin: '0 0 24px' }
const h1 = {
  fontFamily: '"DM Serif Display", Georgia, serif',
  fontSize: '24px',
  color: '#1a1410',
  margin: '0 0 16px',
  fontWeight: 'normal' as const,
}
const text = { fontSize: '15px', color: '#3d362f', lineHeight: '1.6', margin: '0 0 20px' }
const card = {
  backgroundColor: '#faf6ec',
  border: '1px solid #ecdfb8',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '24px 0',
}
const cardAlert = {
  backgroundColor: '#fdf2f1',
  border: '1px solid #f4c7c3',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '24px 0',
}
const cardLabel = {
  fontSize: '11px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.08em',
  color: '#8a7a55',
  margin: '12px 0 2px',
  fontWeight: 600,
}
const cardValue = { fontSize: '17px', color: '#1a1410', margin: '0 0 4px', fontWeight: 500 }
const ratingStyle = {
  fontSize: '22px',
  color: '#c9a84c',
  margin: '0 0 4px',
  letterSpacing: '0.1em',
}
const messageStyle = {
  fontSize: '15px',
  color: '#1a1410',
  margin: '4px 0 0',
  lineHeight: '1.6',
  whiteSpace: 'pre-wrap' as const,
}
const footer = { fontSize: '13px', color: '#8a7a55', margin: '24px 0 0', fontStyle: 'italic' as const }
