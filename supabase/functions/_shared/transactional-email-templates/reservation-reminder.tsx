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

interface ReservationReminderProps {
  name?: string
  date?: string
  time?: string
  partySize?: number
  seating?: 'non-smoking' | 'smoking' | 'outdoor'
  seatingLabel?: string
}

const seatingDisplay = (
  seating?: 'non-smoking' | 'smoking' | 'outdoor',
  seatingLabel?: string,
) => {
  if (seatingLabel) return seatingLabel
  if (seating === 'outdoor') return 'Outdoor'
  if (seating === 'smoking') return 'Smoking'
  if (seating === 'non-smoking') return 'Non-smoking'
  return ''
}

const formatDate = (date?: string) => {
  if (!date) return ''
  try {
    const d = new Date(`${date}T00:00:00`)
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return date
  }
}

const ReservationReminderEmail = ({
  name,
  date,
  time,
  partySize,
  seating,
  seatingLabel,
}: ReservationReminderProps) => {
  const seatingText = seatingDisplay(seating, seatingLabel)
  return (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>
      Reminder: your reservation at {SITE_NAME} is in about 2 hours
    </Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={brand}>{SITE_NAME}</Heading>
        <Hr style={goldRule} />
        <Heading as="h2" style={h1}>
          {name ? `See you soon, ${name}` : 'See you soon'}
        </Heading>
        <Text style={text}>
          This is a friendly reminder that your table at {SITE_NAME} is reserved
          in about 2 hours. We can't wait to host you.
        </Text>

        <Section style={card}>
          <Text style={cardLabel}>Date</Text>
          <Text style={cardValue}>{formatDate(date) || '—'}</Text>
          <Text style={cardLabel}>Time</Text>
          <Text style={cardValue}>{time || '—'}</Text>
          <Text style={cardLabel}>Party</Text>
          <Text style={cardValue}>
            {partySize ? `${partySize} ${partySize === 1 ? 'guest' : 'guests'}` : '—'}
          </Text>
          {seatingText && (
            <>
              <Text style={cardLabel}>Seating</Text>
              <Text style={cardValue}>{seatingText}</Text>
            </>
          )}
        </Section>

        <Text style={text}>
          If your plans have changed, please reply to this email or call us so
          we can offer your table to another guest.
        </Text>

        <Text style={footer}>Warmly,<br />The {SITE_NAME} team</Text>
      </Container>
    </Body>
  </Html>
  )
}

export const template = {
  component: ReservationReminderEmail,
  subject: (data: Record<string, any>) =>
    `Reminder: your reservation at ${SITE_NAME}${data?.time ? ` at ${data.time}` : ''}`,
  displayName: 'Reservation reminder (2 hours before)',
  previewData: {
    name: 'Ani',
    date: '2026-04-20',
    time: '19:30',
    partySize: 4,
    seating: 'outdoor-smoking',
    seatingLabel: 'Outdoor · Smoking',
  },
} satisfies TemplateEntry

// Email body must always be white per Lovable email guidelines, even though
// the app uses a dark Noir & Gold theme. Accents below use the brand gold.
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
  margin: '8px 0 2px',
  fontWeight: 600,
}
const cardValue = {
  fontSize: '17px',
  color: '#1a1410',
  margin: '0 0 4px',
  fontWeight: 500,
}
const footer = {
  fontSize: '13px',
  color: '#8a7a55',
  margin: '32px 0 0',
}
