import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";
import { getRejectionEmailCopy } from "@/lib/refund-rejection-reasons";

interface OrderRefundRejectedEmailProps {
  orderId: string;
  totalDollars: string;
  /** Stored reason (code, "other|||message", or legacy free-text) */
  reason?: string | null;
}

export function OrderRefundRejectedEmail({
  orderId,
  totalDollars,
  reason,
}: OrderRefundRejectedEmailProps) {
  const reasonCopy = getRejectionEmailCopy(reason);
  return (
    <Html>
      <Head />
      <Preview>Refund request update: Order #{orderId.slice(0, 8)}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={headerTitle}>DOOR PARKOUR</Heading>
          </Section>

          <Section style={content}>
            <Heading style={h1}>Refund Request Update</Heading>
            <Text style={paragraph}>
              We&apos;ve reviewed your refund request for the following order:
            </Text>

            <Section style={card}>
              <Text style={cardLabel}>ORDER</Text>
              <Text style={cardValue}>#{orderId.slice(0, 8).toUpperCase()}</Text>

              <Hr style={divider} />

              <Text style={cardLabel}>ORDER TOTAL</Text>
              <Text style={cardValue}>{totalDollars}</Text>
            </Section>

            <Section style={rejectBanner}>
              <Text style={rejectText}>
                Unfortunately, we are unable to approve your refund request at this
                time.
                {reasonCopy && (
                  <>
                    {" "}
                    <strong>Reason:</strong> {reasonCopy}
                  </>
                )}
              </Text>
            </Section>

            <Text style={paragraph}>
              If you have questions or would like to discuss further, please reach
              out. We&apos;re here to help.
            </Text>

            <Button style={button} href="https://doorparkour.com/contact">
              Contact Us
            </Button>

            <Text style={footer}>
              Reply to this email or visit{" "}
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
  margin: "0",
};

const divider: React.CSSProperties = {
  borderColor: "#e5e7eb",
  margin: "12px 0",
};

const rejectBanner: React.CSSProperties = {
  backgroundColor: "#fef3c7",
  borderRadius: "8px",
  border: "1px solid #fcd34d",
  padding: "14px 18px",
  margin: "0 0 24px",
};

const rejectText: React.CSSProperties = {
  color: "#92400e",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "0",
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
