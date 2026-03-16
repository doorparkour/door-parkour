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

interface OrderRefundApprovedEmailProps {
  orderId: string;
  totalDollars: string;
  itemsSummary: string;
}

export function OrderRefundApprovedEmail({
  orderId,
  totalDollars,
  itemsSummary,
}: OrderRefundApprovedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Refund approved: Order #{orderId.slice(0, 8)}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={headerTitle}>DOOR PARKOUR</Heading>
          </Section>

          <Section style={content}>
            <Heading style={h1}>Refund Approved</Heading>
            <Text style={paragraph}>
              Your refund request for the following order has been approved:
            </Text>

            <Section style={card}>
              <Text style={cardLabel}>ORDER</Text>
              <Text style={cardValue}>#{orderId.slice(0, 8).toUpperCase()}</Text>

              <Hr style={divider} />

              <Text style={cardLabel}>ITEMS</Text>
              <Text style={{ ...cardValue, whiteSpace: "pre-line" }}>
                {itemsSummary}
              </Text>

              <Hr style={divider} />

              <Text style={cardLabel}>REFUND AMOUNT</Text>
              <Text style={cardValue}>{totalDollars}</Text>
            </Section>

            <Section style={refundBanner}>
              <Text style={refundText}>
                ✓ A full refund has been issued to your original payment method.
                No return required — you may keep the items. Please allow 5–10
                business days for the refund to appear.
              </Text>
            </Section>

            <Text style={paragraph}>
              Thank you for your patience. We hope to see you at Door Parkour soon.
            </Text>

            <Button style={button} href="https://doorparkour.com/merch">
              Browse Merch
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
  margin: "0",
};

const divider: React.CSSProperties = {
  borderColor: "#e5e7eb",
  margin: "12px 0",
};

const refundBanner: React.CSSProperties = {
  backgroundColor: "#f0fdf4",
  borderRadius: "8px",
  border: "1px solid #bbf7d0",
  padding: "14px 18px",
  margin: "0 0 24px",
};

const refundText: React.CSSProperties = {
  color: "#166534",
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
