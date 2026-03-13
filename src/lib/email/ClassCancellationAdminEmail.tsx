import {
  Body,
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

interface Participant {
  email: string;
  refunded: boolean;
}

interface ClassCancellationAdminEmailProps {
  className: string;
  classDate: string;
  participants: Participant[];
}

export function ClassCancellationAdminEmail({
  className,
  classDate,
  participants,
}: ClassCancellationAdminEmailProps) {
  const refundedCount = participants.filter((p) => p.refunded).length;

  return (
    <Html>
      <Head />
      <Preview>{`Class cancelled: ${className} — ${participants.length} participant${participants.length !== 1 ? "s" : ""} notified`}</Preview>
      <Body style={body}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={headerTitle}>DOOR PARKOUR — ADMIN</Heading>
          </Section>

          {/* Content */}
          <Section style={content}>
            <Heading style={h1}>Class Cancellation Summary</Heading>
            <Text style={paragraph}>
              The following class was cancelled. Here&apos;s a summary of what was processed:
            </Text>

            {/* Class details */}
            <Section style={card}>
              <Text style={cardLabel}>CLASS</Text>
              <Text style={cardValue}>{className}</Text>
              <Hr style={divider} />
              <Text style={cardLabel}>DATE &amp; TIME</Text>
              <Text style={cardValue}>{classDate}</Text>
              <Hr style={divider} />
              <Text style={cardLabel}>PARTICIPANTS NOTIFIED</Text>
              <Text style={cardValue}>{participants.length}</Text>
              <Hr style={divider} />
              <Text style={cardLabel}>REFUNDS ISSUED</Text>
              <Text style={cardValue}>{refundedCount}</Text>
            </Section>

            {participants.length > 0 ? (
              <>
                <Text style={sectionHeading}>Participant Details</Text>
                <Section style={tableContainer}>
                  {/* Header row */}
                  <Section style={tableHeaderRow}>
                    <Text style={tableHeaderCell}>Email</Text>
                    <Text style={{ ...tableHeaderCell, textAlign: "right" }}>Refunded</Text>
                  </Section>
                  <Hr style={divider} />
                  {participants.map((p, i) => (
                    <React.Fragment key={i}>
                      <Section style={tableRow}>
                        <Text style={tableCell}>{p.email}</Text>
                        <Text style={{ ...tableCell, textAlign: "right", color: p.refunded ? "#166534" : "#6b7280" }}>
                          {p.refunded ? "✓ Yes" : "No"}
                        </Text>
                      </Section>
                      {i < participants.length - 1 && <Hr style={rowDivider} />}
                    </React.Fragment>
                  ))}
                </Section>
              </>
            ) : (
              <Text style={paragraph}>No active bookings were found for this class.</Text>
            )}
          </Section>

          <Section style={footerSection}>
            <Text style={footerText}>
              Door Parkour Admin · Sturgeon Bay, WI
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

const sectionHeading: React.CSSProperties = {
  color: "#1C3A4A",
  fontSize: "14px",
  fontWeight: "600",
  margin: "0 0 12px",
};

const tableContainer: React.CSSProperties = {
  backgroundColor: "#f9fafb",
  borderRadius: "8px",
  border: "1px solid #e5e7eb",
  padding: "4px 16px",
  margin: "0 0 24px",
};

const tableHeaderRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
};

const tableHeaderCell: React.CSSProperties = {
  color: "#9ca3af",
  fontSize: "11px",
  fontWeight: "600",
  letterSpacing: "1px",
  margin: "8px 0 0",
};

const tableRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
};

const tableCell: React.CSSProperties = {
  color: "#374151",
  fontSize: "13px",
  margin: "4px 0",
};

const rowDivider: React.CSSProperties = {
  borderColor: "#f3f4f6",
  margin: "0",
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
