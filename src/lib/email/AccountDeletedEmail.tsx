import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

export function AccountDeletedEmail() {
  return (
    <Html>
      <Head />
      <Preview>Account deleted</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={headerTitle}>DOOR PARKOUR</Heading>
          </Section>

          <Section style={content}>
            <Heading style={h1}>Account Deleted</Heading>
            <Text style={paragraph}>
              Your Door Parkour account has been permanently deleted.
            </Text>
            <Text style={paragraph}>
              If you didn&apos;t request this, please contact us at{" "}
              <a href="https://doorparkour.com/contact" style={link}>
                doorparkour.com/contact
              </a>
              .
            </Text>
          </Section>

          <Section style={footerSection}>
            <Text style={footerText}>Door Parkour · Sturgeon Bay, WI</Text>
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
