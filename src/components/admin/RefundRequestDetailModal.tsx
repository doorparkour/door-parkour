"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import ApproveOrderRefundButton from "./ApproveOrderRefundButton";
import RejectOrderRefundButton from "./RejectOrderRefundButton";

type OrderData = {
  id: string;
  total_cents: number;
  order_items: Array<{
    quantity: number;
    unit_price_cents: number;
    products: { name: string } | null;
  }>;
} | null;

type RefundRequest = {
  id: string;
  order_id: string;
  user_id: string;
  requested_at: string;
  customer_reason: string | null;
  orders: OrderData;
};

type Props = {
  request: RefundRequest;
  customerName: string;
};

function formatPrice(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export default function RefundRequestDetailModal({ request, customerName }: Props) {
  const [open, setOpen] = useState(false);
  const order = request.orders;
  const items = order?.order_items ?? [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8 shrink-0">
          <Eye className="size-4" />
          <span className="sr-only">View full details</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Refund Request Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <dl className="grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="font-medium text-muted-foreground">Order</dt>
              <dd className="font-mono">#{order?.id?.toUpperCase() ?? "—"}</dd>
            </div>
            <div>
              <dt className="font-medium text-muted-foreground">Customer</dt>
              <dd>{customerName || "—"}</dd>
            </div>
            <div>
              <dt className="font-medium text-muted-foreground">Amount</dt>
              <dd>{order ? formatPrice(order.total_cents) : "—"}</dd>
            </div>
            <div>
              <dt className="font-medium text-muted-foreground">Requested</dt>
              <dd>
                {new Intl.DateTimeFormat("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                  timeZone: "America/Chicago",
                }).format(new Date(request.requested_at))}
              </dd>
            </div>
          </dl>

          <div>
            <dt className="mb-1 font-medium text-muted-foreground">Items</dt>
            <dd>
              <ul className="list-inside list-disc space-y-0.5">
                {items.length ? (
                  items.map((item, i) => (
                    <li key={i}>
                      {item.products?.name ?? "Product"} × {item.quantity}{" "}
                      ({formatPrice(item.unit_price_cents * item.quantity)})
                    </li>
                  ))
                ) : (
                  <li>—</li>
                )}
              </ul>
            </dd>
          </div>

          <div>
            <dt className="mb-1 font-medium text-muted-foreground">
              Customer feedback
            </dt>
            <dd className="whitespace-pre-wrap rounded-md border bg-muted/30 p-3">
              {request.customer_reason || "—"}
            </dd>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <ApproveOrderRefundButton requestId={request.id} />
            <RejectOrderRefundButton requestId={request.id} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
