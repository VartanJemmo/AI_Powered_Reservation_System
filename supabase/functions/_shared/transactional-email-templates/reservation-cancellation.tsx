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
const ADDRESS = 'Pasteur Street, Gemmayze · Beirut'

interface ReservationCancellationProps {
  name?: string
  date?: string
  time?: string
  partySize?: number
  reason?: 'no-show' | 'cancelled'
}

const formatDate = (date?: string) => {
  if (!date) return ''
  try {
    const d = new Date(`${date}T00:00:00`)
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return date
  }
}

const ReservationCancellationEmail = ({
  name,
  date,
  time,
  partySize,
  reason = 'cancelled',
}: ReservationCancellationProps) => {
  const isNoShow = reason === 'no-show'
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>
        {isNoShow
          ? `We missed you at ${SITE_NAME}`
          : `Your reservation at ${SITE_NAME} has been cancelled`}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={brand}>{SITE_NAME}</Heading>
          <Hr style={goldRule} />
          <Heading as="h2" style={h1}>
            {isNoShow
              ? name
                ? `We missed you, ${name}`
                : 'We missed you'
              : name
              ? `Hello ${name},`
              : 'Your reservation has been cancelled'}
          </Heading>

          {isNoShow ? (
            <>
              <Text style={text}>
                We had your table ready but didn't get the chance to welcome you tonight.
                We hope everything is okay.
              </Text>
              <Text style={text}>
                If your plans changed, no worries — we'd love to host you another time.
                Just reply to this email or give us a call to rebook.
              </Text>
            </>
          ) : (
            <>
              <Text style={text}>
                We're writing to confirm that your reservation at {SITE_NAME} has been
                cancelled. We're sorry we won't be hosting you this time.
              </Text>
              <Text style={text}>
                If this was a mistake, or you'd like to book a new time, simply reply
                to this email or give us a call.
              </Text>
            </>
          )}

          <Section style={card}>
            <Text style={cardLabel}>Original date</Text>
            <Text style={cardValue}>{formatDate(date) || '—'}</Text>
            <Text style={cardLabel}>Original time</Text>
            <Text style={cardValue}>{time || '—'}</Text>
            <Text style={cardLabel}>Party</Text>
            <Text style={cardValue}>
              {partySize ? `${partySize} ${partySize === 1 ? 'guest' : 'guests'}` : '—'}
            </Text>
          </Section>

          <Text style={addressText}>{ADDRESS}</Text>
          <Text style={footer}>Warmly,<br />The {SITE_NAME} team</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: ReservationCancellationEmail,
  subject: (data: Record<string, any>) =>
    data?.reason === 'no-show'
      ? `We missed you at ${SITE_NAME}`
      : `Your reservation at ${SITE_NAME} has been cancelled`,
  displayName: 'Reservation cancellation',
  previewData: {
    name: 'Ani',
    date: '2026-04-20',
    time: '19:30',
    partySize: 4,
    reason: 'cancelled',
  },
} satisfies TemplateEntry

// Email body must be white per Lovable email guidelines.
const main = {
  backgroundColor: '#ffffff',
  fontFamily: '"Fira Sans", Helvetica, Arial, sans-serif',
}
const container = {
  padding: '32px 28px',
  maxWidth: '560px',
  margin: '0 auto',
}
const brand = {
  fontFamily: '"DM Serif Display", Georgia, serif',
  fontSize: '32px',
  color: '#1a1410',
  margin: '0 0 12px',
  letterSpacing: '0.02em',
}
const goldRule = {
  border: 'none',
  borderTop: '2px solid #c9a84c',
  width: '48px',
  margin: '0 0 24px',
}
const h1 = {
  fontFamily: '"DM Serif Display", Georgia, serif',
  fontSize: '24px',
  color: '#1a1410',
  margin: '0 0 16px',
  fontWeight: 'normal' as const,
}
const text = {
  fontSize: '15px',
  color: '#3d362f',
  lineHeight: '1.6',
  margin: '0 0 20px',
}
const card = {
  backgroundColor: '#faf6ec',
  border: '1px solid #ecdfb8',
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
const cardValue = {
  fontSize: '17px',
  color: '#1a1410',
  margin: '0 0 4px',
  fontWeight: 500,
}
const addressText = {
  fontSize: '13px',
  color: '#8a7a55',
  margin: '24px 0 8px',
  fontStyle: 'italic' as const,
}
const footer = {
  fontSize: '13px',
  color: '#8a7a55',
  margin: '8px 0 0',
}
