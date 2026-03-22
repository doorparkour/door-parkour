import { render } from "@react-email/components";
import { Resend } from "resend";
import { ManualRefundEmail } from "@/lib/email/ManualRefundEmail";
import { formatPriceDollars } from "@/lib/format/currency";
import { formatClassDate } from "@/lib/format/date";

export type ManualRefundClassRow = {
  title: string;
  starts_at: string;
  price_cents: number;
};

/** Same “Refund Issued” message used by admin manual refund and Stripe webhook fallback. */
export async function sendManualRefundEmail(params: {
  to: string;
  cls: ManualRefundClassRow;
}): Promise<void> {
  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({
    from: "Door Parkour <noreply@doorparkour.com>",
    to: params.to,
    subject: `Refund Issued: ${params.cls.title}`,
    html: await render(
      ManualRefundEmail({
        className: params.cls.title,
        classDate: formatClassDate(params.cls.starts_at),
        priceDollars: formatPriceDollars(params.cls.price_cents),
      })
    ),
  });
}
