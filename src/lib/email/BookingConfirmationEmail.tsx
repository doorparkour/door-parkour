import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface BookingConfirmationEmailProps {
  className: string;
  classDate: string;
  location: string;
  durationMins: number;
  priceDollars: string;
  /** Youth / guardian checkout: attendee name stored on the booking */
  participantName?: string;
}

export function BookingConfirmationEmail({
  className,
  classDate,
  location,
  durationMins,
  priceDollars,
  participantName,
}: BookingConfirmationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>
        {participantName
          ? `${participantName}'s spot is confirmed for ${className}!`
          : `You\u2019re booked for ${className}!`}
      </Preview>
      <Body style={body}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={headerTitle}>DOOR PARKOUR</Heading>
          </Section>

          {/* Content */}
          <Section style={content}>
            <Heading style={h1}>You&apos;re booked! 🎉</Heading>
            <Text style={paragraph}>
              Your spot is confirmed for <strong>{className}</strong>. See you there!
            </Text>

            {/* Class details card */}
            <Section style={card}>
              <Text style={cardLabel}>CLASS</Text>
              <Text style={cardValue}>{className}</Text>

              {participantName ? (
                <>
                  <Hr style={divider} />
                  <Text style={cardLabel}>PARTICIPANT</Text>
                  <Text style={cardValue}>{participantName}</Text>
                </>
              ) : null}

              <Hr style={divider} />

              <Text style={cardLabel}>DATE &amp; TIME</Text>
              <Text style={cardValue}>{classDate}</Text>

              <Hr style={divider} />

              <Text style={cardLabel}>LOCATION</Text>
              <Text style={cardValue}>{location}</Text>

              <Hr style={divider} />

              <Text style={cardLabel}>DURATION</Text>
              <Text style={cardValue}>{durationMins} minutes</Text>

              <Hr style={divider} />

              <Text style={cardLabel}>AMOUNT PAID</Text>
              <Text style={cardValue}>{priceDollars}</Text>
            </Section>

            <Text style={paragraph}>
              What to bring: wear comfortable athletic clothing and closed-toe shoes.
              We&apos;ll take care of everything else.
            </Text>

            <Button style={button} href="https://doorparkour.com/bookings">
              View My Bookings
            </Button>

            <Text style={footer}>
              Questions? Reply to this email or visit{" "}
              <a href="https://doorparkour.com/contact" style={link}>
                doorparkour.com/contact
              </a>
              .
            </Text>
          </Section>

          <Section style={footerSection}>
            <Text style={footerText}>
              Door Parkour · Sturgeon Bay, WI
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const body: React.CSSProperties = {
  backgroundColor: "#f4f4f5",
  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
};

const container: React.CSSProperties = {
  margin: "0 auto",
  maxWidth: "560px",
};

const header: React.CSSProperties = {
  backgroundColor: "#1C3A4A",
  borderRadius: "8px 8px 0 0",
  padding: "24px 32px",
};

const headerTitle: React.CSSProperties = {
  color: "#ffffff",
  fontSize: "20px",
  fontWeight: "800",
  letterSpacing: "2px",
  margin: "0",
};

const content: React.CSSProperties = {
  backgroundColor: "#ffffff",
  padding: "32px",
};

const h1: React.CSSProperties = {
  color: "#1C3A4A",
  fontSize: "24px",
  fontWeight: "700",
  margin: "0 0 16px",
};

const paragraph: React.CSSProperties = {
  color: "#4b5563",
  fontSize: "15px",
  lineHeight: "24px",
  margin: "0 0 20px",
};

const card: React.CSSProperties = {
  backgroundColor: "#f9fafb",
  borderRadius: "8px",
  border: "1px solid #e5e7eb",
  padding: "20px 24px",
  margin: "0 0 24px",
};

const cardLabel: React.CSSProperties = {
  color: "#9ca3af",
  fontSize: "11px",
  fontWeight: "600",
  letterSpacing: "1px",
  margin: "0 0 4px",
};

const cardValue: React.CSSProperties = {
  color: "#1C3A4A",
  fontSize: "15px",
  fontWeight: "600",
  margin: "0 0 12px",
};

const divider: React.CSSProperties = {
  borderColor: "#e5e7eb",
  margin: "12px 0",
};

const button: React.CSSProperties = {
  backgroundColor: "#F7941D",
  borderRadius: "6px",
  color: "#ffffff",
  display: "inline-block",
  fontSize: "15px",
  fontWeight: "600",
  padding: "12px 24px",
  textDecoration: "none",
  margin: "0 0 24px",
};

const footer: React.CSSProperties = {
  color: "#9ca3af",
  fontSize: "13px",
  lineHeight: "20px",
  margin: "0",
};

const link: React.CSSProperties = {
  color: "#F7941D",
};

const footerSection: React.CSSProperties = {
  backgroundColor: "#1C3A4A",
  borderRadius: "0 0 8px 8px",
  padding: "16px 32px",
};

const footerText: React.CSSProperties = {
  color: "#ffffff80",
  fontSize: "12px",
  margin: "0",
  textAlign: "center",
};
