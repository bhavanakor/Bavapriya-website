"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useCart } from "@/componenets/CartProvider";

type OrderConfirmation = {
  id: string;
  total: number;
  spreadsheetError?: string;
};

type OrderResponse = {
  success?: boolean;
  error?: string;
  sellerWhatsApp?: string;
  order?: {
    id: string;
    itemsTotal: number;
    personName: string;
    phone: string;
    email: string;
    productsWanted: string;
    spreadsheetError?: string;
  };
};

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<OrderConfirmation | null>(null);

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

    const whatsappWindow = window.open("about:blank", "_blank");
    if (!whatsappWindow) {
      setError("Please allow pop-ups so we can open WhatsApp after your order.");
      return;
    }

    setSubmitting(true);
    const form = new FormData(event.currentTarget);
    const fullName = String(form.get("fullName") ?? "").trim();
    const phone = String(form.get("phone") ?? "").trim();
    const customerEmail = String(form.get("email") ?? "").trim().toLowerCase();

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

      const data = (await response.json()) as OrderResponse;
      if (!response.ok || !data.success || !data.order) {
        whatsappWindow.close();
        setError(data.error || "Could not place your order. Please try again.");
        return;
      }

      const savedOrder = data.order;
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
      whatsappWindow.location.href =
        `https://wa.me/${sellerWhatsApp}?text=${encodeURIComponent(whatsappMessage)}`;

      setPlacedOrder({
        id: savedOrder.id,
        total: savedOrder.itemsTotal,
        spreadsheetError: savedOrder.spreadsheetError,
      });
      clearCart();
    } catch (submitError) {
      whatsappWindow.close();
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
  );
}
