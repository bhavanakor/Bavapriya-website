
"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useCart } from "@/componenets/CartProvider";

export default function CartPage() {
  const { items, total, updateQuantity, removeItem, clearCart } = useCart();

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [order, setOrder] = useState<{
    id: string;
    total: number;
    spreadsheetError?: string;
  } | null>(null);

  // ==========================================
  // EMPTY CART / ORDER CONFIRMATION
  // ==========================================

  if (items.length === 0) {
    if (order) {
      return (
        <div className="max-w-xl mx-auto px-6 py-20 text-center">
          <h1 className="font-serif text-3xl text-[#3A4F41] mb-3">
            Thank you for your order
          </h1>

          <p className="text-[#3A4F41]/75 mb-2">
            Your order has been received.
          </p>

          <p className="font-semibold text-[#3A4F41] mb-2">
            Order number: {order.id}
          </p>

          <p className="text-[#3A4F41]/75 mb-8">
            Total: ₹{order.total}
          </p>

          {order.spreadsheetError && (
            <p role="alert" className="mb-6 text-sm text-amber-800">
              Your order was recorded, but it could not be added to the
              Orders spreadsheet: {order.spreadsheetError}
            </p>
          )}

          <Link href="/#products" className="text-[#8BA888] underline">
            Continue shopping
          </Link>
        </div>
      );
    }

    return (
      <div className="max-w-3xl mx-auto px-6 py-20 text-center">
        <h1 className="font-serif text-3xl text-[#3A4F41] mb-3">
          Your cart is empty
        </h1>

        <p className="text-[#3A4F41]/70 mb-8">
          Add a powder and it will stay here until you order.
        </p>

        <Link
          href="/#products"
          className="inline-flex bg-[#8BA888] text-white px-6 py-3 rounded-full font-semibold"
        >
          Browse products
        </Link>
      </div>
    );
  }

  // ==========================================
  // PLACE ORDER + WHATSAPP CONNECTION
  // ==========================================

  const placeOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");
    setIsSubmitting(true);

    // Open a temporary tab immediately during the user's click.
    // This helps avoid browser popup blocking after the API request.
    const whatsappWindow = window.open("about:blank", "_blank");

    if (!whatsappWindow) {
      setError("Please allow pop-ups to continue to WhatsApp.");
      setIsSubmitting(false);
      return;
    }

    const form = new FormData(event.currentTarget);

    const fullName = String(form.get("fullName") ?? "").trim();
    const phone = String(form.get("phone") ?? "").trim();
    const customerEmail = String(form.get("email") ?? "")
      .trim()
      .toLowerCase();

    try {
      // Send order to the existing Next.js API
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items,
          customerEmail,
          shipping: {
            fullName,
            phone,
          },
        }),
      });

      const data = await response.json();

      // Stop if order saving fails
      if (!response.ok || !data.success || !data.order) {
        whatsappWindow.close();

        setError(
          data.error || "Could not place the order. Please try again."
        );

        return;
      }

      const savedOrder = data.order;

      // Prepare WhatsApp message using the saved order details
      const whatsappMessage = `
 Good morning Vidya!

${savedOrder.personName} here!

I have placed an order through the Bavapriya website.

ORDER DETAILS
-------------------------
Order ID: ${savedOrder.id}

Customer Name: ${savedOrder.personName}
Phone: ${savedOrder.phone}
Email: ${savedOrder.email}

PRODUCTS ORDERED
-------------------------
${savedOrder.productsWanted}

Total Amount: ₹${savedOrder.itemsTotal}

Kindly share the UPI payment QR.

Thank you!
      `.trim();

      // Seller WhatsApp number
      const sellerWhatsApp =
        data.sellerWhatsApp || "919043891268";

      const whatsappURL =
        `https://wa.me/${sellerWhatsApp}?text=${encodeURIComponent(
          whatsappMessage
        )}`;

      // Redirect the temporary tab to WhatsApp
      whatsappWindow.location.href = whatsappURL;

      // Preserve the original order confirmation
      setOrder({
        id: savedOrder.id,
        total: savedOrder.itemsTotal,
        spreadsheetError: savedOrder.spreadsheetError,
      });

      clearCart();
      setIsCheckoutOpen(false);

    } catch (submitError) {
      whatsappWindow.close();

      setError(
        submitError instanceof Error
          ? submitError.message
          : "Could not place the order. Please try again."
      );

    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================
  // CART PAGE
  // ==========================================

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <h1 className="font-serif text-3xl text-[#3A4F41] mb-8">
        Your cart
      </h1>

      <div className="grid lg:grid-cols-[1fr_320px] gap-8">
        {/* CART ITEMS */}

        <ul className="space-y-4">
          {items.map((item) => (
            <li
              key={`${item.productId}-${item.sizeId}`}
              className="bg-white rounded-2xl border border-[#3A4F41]/10 p-4 flex gap-4"
            >
              <img
                src={item.image}
                alt=""
                className="w-24 h-24 rounded-xl object-cover"
              />

              <div className="flex-1 min-w-0">
                <h2 className="font-medium text-[#3A4F41]">
                  {item.name}
                </h2>

                <p className="text-sm text-[#3A4F41]/70">
                  {item.sizeLabel}
                </p>

                <p className="text-sm text-[#8BA888] mt-1">
                  ₹{item.price} {item.courierNote}
                </p>

                <div className="mt-3 flex items-center gap-3">
                  <div className="flex items-center border rounded-lg">
                    <button
                      type="button"
                      className="w-8 h-8"
                      onClick={() =>
                        updateQuantity(
                          item.productId,
                          item.sizeId,
                          item.quantity - 1
                        )
                      }
                    >
                      −
                    </button>

                    <span className="w-8 text-center">
                      {item.quantity}
                    </span>

                    <button
                      type="button"
                      className="w-8 h-8"
                      onClick={() =>
                        updateQuantity(
                          item.productId,
                          item.sizeId,
                          item.quantity + 1
                        )
                      }
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    className="text-sm text-red-700"
                    onClick={() =>
                      removeItem(item.productId, item.sizeId)
                    }
                  >
                    Remove
                  </button>
                </div>
              </div>

              <p className="font-semibold">
                ₹{item.price * item.quantity}
              </p>
            </li>
          ))}
        </ul>

        {/* ORDER SUMMARY */}

        <aside className="bg-white rounded-2xl border border-[#3A4F41]/10 p-6 h-fit">
          <h2 className="font-semibold mb-4">
            Order summary
          </h2>

          <div className="flex justify-between mb-2">
            <span>Items</span>
            <span>₹{total}</span>
          </div>

          <p className="text-sm text-[#3A4F41]/70 mb-6">
            Courier charges extra at dispatch.
          </p>

          <Link
            href="/checkout"
            className="block w-full text-center bg-[#3A4F41] text-white rounded-full py-3 font-semibold"
          >
            Proceed to checkout
          </Link>
        </aside>
      </div>

      {/* CHECKOUT POPUP */}

      {isCheckoutOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !isSubmitting
            ) {
              setIsCheckoutOpen(false);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="checkout-title"
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-[#FAF9F6] p-6 shadow-xl"
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2
                  id="checkout-title"
                  className="font-serif text-2xl text-[#3A4F41]"
                >
                  Complete your order
                </h2>

                <p className="mt-1 text-sm text-[#3A4F41]/70">
                  Enter your contact details and confirm the cart total.
                </p>
              </div>

              <button
                type="button"
                aria-label="Close checkout"
                disabled={isSubmitting}
                onClick={() => setIsCheckoutOpen(false)}
                className="rounded-full px-2 py-1 text-xl leading-none text-[#3A4F41] disabled:opacity-50"
              >
                ×
              </button>
            </div>

            {/* ORDER PREVIEW */}

            <div className="mb-5 rounded-xl border border-[#3A4F41]/10 bg-white p-4">
              <h3 className="mb-3 font-semibold text-[#3A4F41]">
                Your order
              </h3>

              <ul className="space-y-2 text-sm">
                {items.map((item) => (
                  <li
                    key={`${item.productId}-${item.sizeId}`}
                    className="flex justify-between gap-4"
                  >
                    <span>
                      {item.name} · {item.sizeLabel} × {item.quantity}
                    </span>

                    <span className="shrink-0">
                      ₹{item.price * item.quantity}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-3 flex justify-between border-t border-[#3A4F41]/10 pt-3 font-semibold">
                <span>Total</span>
                <span>₹{total}</span>
              </div>

              <p className="mt-2 text-xs text-[#3A4F41]/70">
                Courier charges are extra and collected at dispatch.
              </p>
            </div>

            {/* CUSTOMER FORM */}

            <form onSubmit={placeOrder} className="space-y-3">
              <label className="block text-sm font-medium text-[#3A4F41]">
                Name

                <input
                  name="fullName"
                  required
                  autoComplete="name"
                  className="mt-1 w-full rounded-lg border border-[#3A4F41]/20 bg-white px-4 py-3 font-normal"
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
                  className="mt-1 w-full rounded-lg border border-[#3A4F41]/20 bg-white px-4 py-3 font-normal"
                />
              </label>

              <label className="block text-sm font-medium text-[#3A4F41]">
                Email

                <input
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  className="mt-1 w-full rounded-lg border border-[#3A4F41]/20 bg-white px-4 py-3 font-normal"
                />
              </label>

              {error && (
                <p role="alert" className="text-sm text-red-700">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-full bg-[#3A4F41] py-3 font-semibold text-white disabled:opacity-60"
              >
                {isSubmitting
                  ? "Submitting order…"
                  : "Submit order"}
              </button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
