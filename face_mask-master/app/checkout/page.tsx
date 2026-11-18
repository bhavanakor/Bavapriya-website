"use client";

import { FormEvent, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useCart } from "@/componenets/CartProvider";
import type { CartItem } from "@/lib/types";

type OrderConfirmation = {
  id: string;
  total: number;
  spreadsheetError?: string;
  receiptError?: string;
};

type OrderResponse = {
  success?: boolean;
  error?: string;
  sellerWhatsApp?: string;
  order?: {
    id: string;
    createdAt: string;
    itemsTotal: number;
    personName: string;
    phone: string;
    email: string;
    items: CartItem[];
    productsWanted: string;
    spreadsheetError?: string;
  };
};

async function downloadReceipt(order: NonNullable<OrderResponse["order"]>) {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const left = 14;
  const right = pageWidth - left;
  const brown: [number, number, number] = [135, 57, 8];
  const gold: [number, number, number] = [151, 99, 24];
  const ink: [number, number, number] = [47, 43, 39];
  const muted: [number, number, number] = [105, 101, 96];
  const pink: [number, number, number] = [179, 28, 79];
  let y = 0;

  const drawTableHeader = () => {
    const headerY = y;
    pdf.setFillColor(...brown);
    pdf.rect(left, headerY, right - left, 11, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(255, 255, 255);
    pdf.text("Description", left + 4, headerY + 7);
    pdf.text("Qty", 119, headerY + 7, { align: "center" });
    pdf.text("Price", 160, headerY + 7, { align: "right" });
    pdf.text("Total", right - 4, headerY + 7, { align: "right" });
    y += 11;
  };

  const drawPageHeader = () => {
    pdf.setFillColor(250, 249, 246);
    pdf.rect(0, 0, pageWidth, pageHeight, "F");
    pdf.setFillColor(...gold);
    pdf.triangle(pageWidth - 105, 0, pageWidth, 0, pageWidth - 70, 24, "F");
    pdf.setFillColor(...brown);
    pdf.triangle(pageWidth - 60, 0, pageWidth, 0, pageWidth, 42, "F");

    pdf.setTextColor(...ink);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.text("BAVAPRIYA FACIALS", left + 5, 23);

    pdf.setTextColor(...pink);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(23);
    pdf.text("INVOICE", left + 4, 39);

    pdf.setTextColor(...ink);
    pdf.setFontSize(10);
    pdf.text(`BILL NO: INV-${order.id}`, right - 4, 42, { align: "right" });

    pdf.setFontSize(11);
    pdf.text("Bill To:", left + 4, 58);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(...muted);
    pdf.text(order.personName, left + 4, 65);
    pdf.text(`Phone: ${order.phone}`, left + 4, 71);
    pdf.text(`Email: ${order.email}`, left + 4, 77);

    pdf.setTextColor(...ink);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.text("From:", right - 4, 58, { align: "right" });
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(...muted);
    pdf.setFontSize(9);
    pdf.text("Vidya.K", right - 4, 65, { align: "right" });
    pdf.text("+91 9677165794", right - 4, 71, { align: "right" });
    pdf.text("Bavapriya Associates - Panmal", right - 4, 77, {
      align: "right",
    });

    pdf.setTextColor(...ink);
    pdf.setFontSize(9);
    pdf.text(
      `Date: ${new Date(order.createdAt).toLocaleDateString("en-IN")}`,
      left + 4,
      88
    );
    y = 96;
    drawTableHeader();
  };

  drawPageHeader();

  for (const item of order.items) {
    const description = pdf.splitTextToSize(
      `${item.name} (${item.sizeLabel})`,
      88
    ) as string[];
    const rowHeight = Math.max(10, description.length * 4.5 + 4);

    if (y + rowHeight > pageHeight - 38) {
      pdf.addPage();
      drawPageHeader();
    }

    pdf.setTextColor(...ink);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.text(description, left + 4, y + 6);
    pdf.text(String(item.quantity), 119, y + 6, { align: "center" });
    pdf.text(`INR ${item.price.toFixed(2)}`, 160, y + 6, {
      align: "right",
    });
    pdf.text(`INR ${(item.price * item.quantity).toFixed(2)}`, right - 4, y + 6, {
      align: "right",
    });
    y += rowHeight;
    pdf.setDrawColor(229, 103, 103);
    pdf.setLineWidth(0.25);
    pdf.line(left, y, right, y);
  }

  if (y + 58 > pageHeight - 8) {
    pdf.addPage();
    y = 24;
  }

  y += 5;
  const totalBoxWidth = 86;
  const totalBoxX = right - totalBoxWidth;
  pdf.setFillColor(47, 47, 47);
  pdf.rect(totalBoxX, y, totalBoxWidth, 11, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(255, 255, 255);
  pdf.text("Sub Total", totalBoxX + 5, y + 7);
  pdf.text(`INR ${order.itemsTotal.toFixed(2)}`, right - 4, y + 7, {
    align: "right",
  });

  y += 32;
  pdf.setTextColor(...ink);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.text("Payment Information:", left + 4, y);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(...muted);
  pdf.setFontSize(9);
  pdf.text("Cash on delivery / as arranged with the seller", left + 4, y + 7);
  pdf.text("Courier charges are extra and collected at dispatch.", left + 4, y + 13);

  pdf.setTextColor(...brown);
  pdf.setFont("times", "italic");
  pdf.setFontSize(25);
  pdf.text("Thank You!", right - 4, y + 22, { align: "right" });
  pdf.setFillColor(47, 47, 47);
  pdf.rect(0, pageHeight - 4, pageWidth, 4, "F");

  const receiptBlob = pdf.output("blob");
  if (receiptBlob.size === 0) {
    throw new Error("The generated receipt PDF is empty.");
  }

  const downloadUrl = URL.createObjectURL(receiptBlob);
  const downloadLink = document.createElement("a");
  downloadLink.href = downloadUrl;
  downloadLink.download = `Bavapriya-Invoice-${order.id}.pdf`;
  document.body.appendChild(downloadLink);
  downloadLink.click();
  downloadLink.remove();
  window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 60_000);
}

function ReceiptPrintingOverlay({
  message,
  caption,
  onAnimationComplete,
}: {
  message: string;
  caption: string;
  onAnimationComplete: () => void;
}) {
  return (
    <div className="receipt-overlay" role="status" aria-live="polite">
      <div className="receipt-printer">
        <div className="receipt-printer__slot" />
        <div
          className="receipt-paper"
          onAnimationEnd={(event) => {
            if (event.target === event.currentTarget) onAnimationComplete();
          }}
        >
          <span className="receipt-paper__brand">BAVAPRIYA</span>
          <span className="receipt-paper__line" />
          <span className="receipt-paper__line receipt-paper__line--short" />
          <span className="receipt-paper__total">ORDER CONFIRMED</span>
          <span className="receipt-paper__line" />
          <span className="receipt-paper__line receipt-paper__line--short" />
        </div>
        <div className="receipt-printer__body">
          <span className="receipt-printer__light" />
          <span className="receipt-printer__label">BAVAPRIYA · RECEIPT</span>
        </div>
      </div>
      <p className="receipt-overlay__title">{message}</p>
      <p className="receipt-overlay__caption">{caption}</p>
    </div>
  );
}

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [printingReceipt, setPrintingReceipt] = useState(false);
  const [receiptMessage, setReceiptMessage] = useState("Printing your bill");
  const [receiptCaption, setReceiptCaption] = useState(
    "Please wait while we prepare your order."
  );
  const [placedOrder, setPlacedOrder] = useState<OrderConfirmation | null>(null);
  const animationFinishedAt = useRef<number | null>(null);

  const waitForReceiptAnimation = async (startedAt: number) => {
    const minVisibleMs = 2500;
    const remaining = Math.max(0, minVisibleMs - (Date.now() - startedAt));
    if (remaining > 0) {
      await new Promise((resolve) => window.setTimeout(resolve, remaining));
    }

    const animationDeadline = startedAt + 4000;
    while (animationFinishedAt.current === null && Date.now() < animationDeadline) {
      await new Promise((resolve) => window.setTimeout(resolve, 50));
    }
  };

  if (items.length === 0 && !placedOrder) {
    return (
      <div className="mx-auto max-w-xl px-6 py-20 text-center">
        <h1 className="mb-3 font-serif text-3xl text-[#3A4F41]">
          Nothing to order yet
        </h1>
        <Link href="/#products" className="text-[#8BA888] underline">
          Add products to your cart
        </Link>
      </div>
    );
  }

  const placeOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const form = new FormData(event.currentTarget);
    const fullName = String(form.get("fullName") ?? "").trim();
    const phone = String(form.get("phone") ?? "").trim();
    const customerEmail = String(form.get("email") ?? "").trim().toLowerCase();

    setSubmitting(true);
    setReceiptMessage("Printing your bill");
    setReceiptCaption("Please wait while we prepare your order.");
    animationFinishedAt.current = null;
    const confirmationStartedAt = Date.now();
    setPrintingReceipt(true);
    await new Promise<void>((resolve) =>
      window.requestAnimationFrame(() =>
        window.requestAnimationFrame(() => resolve())
      )
    );
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          customerEmail,
          shipping: {
            fullName,
            phone,
            line1: "",
            city: "",
            state: "",
            pincode: "",
          },
        }),
      });

      const responseBody = await response.text();
      let data: OrderResponse;
      try {
        data = JSON.parse(responseBody) as OrderResponse;
      } catch {
        throw new Error(
          `The server returned an unexpected response (HTTP ${response.status}). Please try again.`
        );
      }

      if (!response.ok || !data.success || !data.order) {
        await waitForReceiptAnimation(confirmationStartedAt);
        setPrintingReceipt(false);
        setError(data.error || "Could not place your order. Please try again.");
        return;
      }

      const savedOrder = data.order;
      await waitForReceiptAnimation(confirmationStartedAt);

      let receiptError: string | undefined;
      try {
        setReceiptMessage("Downloading your bill");
        setReceiptCaption("Your PDF receipt is being saved to your device.");
        await downloadReceipt(savedOrder);
      } catch (receiptGenerationError) {
        console.error("Receipt PDF generation failed:", receiptGenerationError);
        receiptError = "The order was placed, but the receipt could not be downloaded.";
      }

      const whatsappMessage = [
        "Good morning Vidya!",
        "",
        `${savedOrder.personName} here!`,
        "",
        "I have placed an order through the Bavapriya website.",
        "",
        "ORDER DETAILS",
        "-------------------------",
        `Order ID: ${savedOrder.id}`,
        "",
        `Customer Name: ${savedOrder.personName}`,
        `Phone: ${savedOrder.phone}`,
        `Email: ${savedOrder.email}`,
        "",
        "PRODUCTS ORDERED",
        "-------------------------",
        savedOrder.productsWanted,
        "",
        `Total Amount: ₹${savedOrder.itemsTotal}`,
        "",
        "Kindly share the UPI payment QR.",
        "",
        "Thank you!",
      ].join("\n");

      const sellerWhatsApp = data.sellerWhatsApp || "919043891268";
      if (receiptError) {
        setPlacedOrder({
          id: savedOrder.id,
          total: savedOrder.itemsTotal,
          spreadsheetError: savedOrder.spreadsheetError,
          receiptError,
        });
        setPrintingReceipt(false);
        clearCart();
        return;
      }

      setReceiptMessage("Bill downloaded · Opening WhatsApp");
      setReceiptCaption("Your receipt is ready. Taking you to WhatsApp shortly.");
      await new Promise((resolve) => window.setTimeout(resolve, 1800));
      setPlacedOrder({
        id: savedOrder.id,
        total: savedOrder.itemsTotal,
        spreadsheetError: savedOrder.spreadsheetError,
        receiptError,
      });
      setPrintingReceipt(false);
      clearCart();
      await new Promise((resolve) => window.setTimeout(resolve, 1000));
      window.location.assign(
        `https://wa.me/${sellerWhatsApp}?text=${encodeURIComponent(whatsappMessage)}`
      );
    } catch (submitError) {
      await waitForReceiptAnimation(confirmationStartedAt);
      setPrintingReceipt(false);
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Could not place your order. Please check your connection and try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (placedOrder) {
    return (
      <div className="mx-auto max-w-xl px-6 py-20 text-center">
        <h1 className="mb-3 font-serif text-3xl text-[#3A4F41]">
          Thank you for your order!
        </h1>
        <p className="mb-2 text-[#3A4F41]/70">
          Your order has been recorded. WhatsApp has opened so you can message the seller.
        </p>
        <p className="mb-2 font-semibold text-[#3A4F41]">
          Order ID: {placedOrder.id}
        </p>
        <p className="mb-6 text-[#3A4F41]/70">Total: ₹{placedOrder.total}</p>
        {placedOrder.receiptError && (
          <p role="alert" className="mb-6 text-sm text-amber-800">
            {placedOrder.receiptError} You can still continue with your WhatsApp order.
          </p>
        )}
        {placedOrder.spreadsheetError && (
          <p role="alert" className="mb-6 text-sm text-amber-800">
            Your order was recorded, but it could not be added to the Orders spreadsheet:
            {" "}{placedOrder.spreadsheetError}
          </p>
        )}
        <Link
          href="/#products"
          className="inline-flex rounded-full bg-[#3A4F41] px-6 py-3 font-semibold text-white"
        >
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <>
    {printingReceipt && typeof document !== "undefined" &&
      createPortal(
        <ReceiptPrintingOverlay
          message={receiptMessage}
          caption={receiptCaption}
          onAnimationComplete={() => {
            animationFinishedAt.current = Date.now();
          }}
        />,
        document.body
      )}
    <div className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="mb-2 font-serif text-3xl text-[#3A4F41]">Checkout</h1>
      <p className="mb-8 text-[#3A4F41]/70">
        Enter your contact details to confirm your order.
      </p>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <form
          id="checkout-form"
          onSubmit={placeOrder}
          className="space-y-4 rounded-2xl border border-[#3A4F41]/10 bg-white p-6"
        >
          <h2 className="font-semibold text-[#3A4F41]">Your details</h2>
          <label className="block text-sm font-medium text-[#3A4F41]">
            Name
            <input
              name="fullName"
              required
              autoComplete="name"
              className="mt-1 w-full rounded-lg border px-4 py-3 font-normal"
            />
          </label>
          <label className="block text-sm font-medium text-[#3A4F41]">
            Phone number
            <input
              name="phone"
              type="tel"
              required
              inputMode="numeric"
              pattern="[0-9]{10}"
              maxLength={10}
              autoComplete="tel"
              title="Enter a valid 10-digit phone number"
              className="mt-1 w-full rounded-lg border px-4 py-3 font-normal"
            />
          </label>
          <label className="block text-sm font-medium text-[#3A4F41]">
            Email
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className="mt-1 w-full rounded-lg border px-4 py-3 font-normal"
            />
          </label>
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        </form>

        <aside className="h-fit rounded-2xl border border-[#3A4F41]/10 bg-white p-6">
          <h2 className="mb-4 font-semibold">Order summary</h2>
          <ul className="mb-4 space-y-3 text-sm">
            {items.map((item) => (
              <li
                key={`${item.productId}-${item.sizeId}`}
                className="flex justify-between gap-3"
              >
                <span>{item.name} · {item.sizeLabel} × {item.quantity}</span>
                <span className="shrink-0">₹{item.price * item.quantity}</span>
              </li>
            ))}
          </ul>
          <div className="mb-2 flex justify-between border-t border-[#3A4F41]/10 pt-3 font-semibold">
            <span>Items total</span>
            <span>₹{total}</span>
          </div>
          <p className="mb-6 text-xs text-[#3A4F41]/70">
            Courier charges are extra and collected at dispatch.
          </p>
          <button
            type="submit"
            form="checkout-form"
            disabled={submitting}
            className="w-full rounded-full bg-[#3A4F41] py-3 font-semibold text-white disabled:opacity-60"
          >
            {submitting ? "Placing order…" : "Confirm order"}
          </button>
        </aside>
      </div>
    </div>
    </>
  );
}
