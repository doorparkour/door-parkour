import { Resend } from "resend";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  const { firstName, lastName, email, subject, message } = await req.json();

  const { error } = await resend.emails.send({
    from: "noreply@doorparkour.com",
    to: "steven@doorparkour.com",
    subject: `[Contact] ${subject}`,
    html: `
      <p><strong>From:</strong> ${firstName} ${lastName} (${email})</p>
      <p><strong>Subject:</strong> ${subject}</p>
      <p><strong>Message:</strong></p>
      <p>${message.replace(/\n/g, "<br/>")}</p>
    `,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
