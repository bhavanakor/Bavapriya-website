
import { NextResponse } from "next/server";
import { createOrder, createOrderRecord } from "@/lib/orders";
import { products, sizeOptions } from "@/lib/products";
import type { CartItem, ShippingAddress } from "@/lib/types";
import { cartTotal } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ==========================================
// 1. VALIDATE AND NORMALIZE CART ITEMS
// ==========================================

function normalizeItems(raw: unknown): CartItem[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new Error("Your cart is empty.");
  }

  return raw.map((row) => {
    const productId = Number(row?.productId);
    const sizeId = String(row?.sizeId ?? "");
    const quantity = Math.max(
      1,
      Math.min(20, Number(row?.quantity) || 1)
    );

    const product = products.find(
      (item) => item.id === productId
    );

    const size = sizeOptions.find(
      (item) => item.id === sizeId
    );

    if (!product || !size) {
      throw new Error(
        "One of the products in your cart is no longer available."
      );
    }

    return {
      productId: product.id,
      name: product.name,
      image: product.image,
      sizeId: size.id,
      sizeLabel: size.label,
      price: size.price,
      courierNote: size.courierNote,
      quantity,
    };
  });
}

// ==========================================
// 2. VALIDATE CUSTOMER DETAILS
// ==========================================

function normalizeShipping(raw: unknown): ShippingAddress {
  const value = (raw ?? {}) as Record<string, string>;

  const shipping: ShippingAddress = {
    fullName: String(value.fullName ?? "").trim(),
    phone: String(value.phone ?? "").trim(),
    line1: String(value.line1 ?? "").trim(),
    line2: String(value.line2 ?? "").trim() || undefined,
    city: String(value.city ?? "").trim(),
    state: String(value.state ?? "").trim(),
    pincode: String(value.pincode ?? "").trim(),
  };

  if (!shipping.fullName || !shipping.phone) {
    throw new Error("Enter your name and phone number.");
  }

  if (!/^[0-9]{10}$/.test(shipping.phone)) {
    throw new Error("Enter a valid 10-digit phone number.");
  }

  if (
    shipping.pincode &&
    !/^[0-9]{6}$/.test(shipping.pincode)
  ) {
    throw new Error("Enter a valid 6-digit pincode.");
  }

  return shipping;
}

function isReadOnlyFilesystemError(error: unknown): boolean {
  return (
    error instanceof Error &&
    "code" in error &&
    (error.code === "EROFS" || error.code === "EACCES")
  );
}

// ==========================================
// 3. SAVE ORDER TO GOOGLE SHEETS
// ==========================================

async function saveOrderToSpreadsheet(order: {
  id: string;
  name: string;
  phone: string;
  email: string;
  items: CartItem[];
  itemsTotal: number;
}) {
  const scriptUrl =
    process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL;

  if (!scriptUrl) {
    throw new Error(
      "Google Sheets integration is not configured."
    );
  }

  // Format all products as bullet points
  const productsWanted = order.items
    .map(
      (item) =>
        `• ${item.name} (${item.sizeLabel}) × ${item.quantity}`
    )
    .join("\n");

  const response = await fetch(scriptUrl, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    body: JSON.stringify({
      action: "order",
      orderId: order.id,
      personName: order.name,
      productsWanted: productsWanted,
      totalAmount: order.itemsTotal,
      email: order.email,
      phoneNumber: order.phone,
    }),
    cache: "no-store",
  });

  let result: {
    success?: unknown;
    message?: unknown;
  };

  try {
    result = await response.json();
  } catch {
    throw new Error(
      "Google Sheets returned an unreadable response."
    );
  }

  if (!response.ok || result.success !== true) {
    const message =
      typeof result.message === "string"
        ? result.message
        : "Google Sheets could not save the order.";

    throw new Error(message);
  }

  return productsWanted;
}

// ==========================================
// 4. GET REQUEST
// ==========================================

export async function GET() {
  return NextResponse.json(
    { error: "Order history is not available." },
    {
      status: 410,
      headers: { Allow: "POST" },
    }
  );
}

// ==========================================
// 5. PLACE ORDER
// ==========================================

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate cart
    const items = normalizeItems(body.items);

    // Validate customer details
    const shipping = normalizeShipping(body.shipping);

    const customerEmail = String(
      body.customerEmail ?? ""
    )
      .trim()
      .toLowerCase();

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)
    ) {
      throw new Error("Enter a valid email address.");
    }

    const notes =
      String(body.notes ?? "").trim() || undefined;

    // Calculate total using server-side product prices
    const total = cartTotal(items);

    // Create order
    const orderInput = {
      user: {
        id: customerEmail,
        name: shipping.fullName,
        email: customerEmail,
      },
      shipping,
      items,
      itemsTotal: total,
      notes,
      paymentMethod: "cod",
    } satisfies Parameters<typeof createOrder>[0];

    const isVercelDeployment =
      process.env.VERCEL === "1" || Boolean(process.env.VERCEL_ENV);
    let order = createOrderRecord(orderInput);
    let usedReadOnlyFilesystemFallback = isVercelDeployment;

    if (!isVercelDeployment) {
      try {
        order = await createOrder(orderInput);
      } catch (error) {
        if (!isReadOnlyFilesystemError(error)) throw error;
        usedReadOnlyFilesystemFallback = true;
        console.warn(
          "Order file storage is read-only; using the configured spreadsheet integration."
        );
      }
    }

    let spreadsheetError: string | undefined;
    let productsWanted = items
      .map(
        (item) =>
          `• ${item.name} (${item.sizeLabel}) × ${item.quantity}`
      )
      .join("\n");

    try {
      productsWanted = await saveOrderToSpreadsheet({
        id: order.id,
        name: shipping.fullName,
        phone: shipping.phone,
        email: customerEmail,
        items,
        itemsTotal: order.itemsTotal,
      });
    } catch (error) {
      spreadsheetError =
        error instanceof Error
          ? error.message
          : "Could not save this order to the Orders spreadsheet.";
      console.error("Order spreadsheet submission failed:", error);
    }

    if (usedReadOnlyFilesystemFallback && spreadsheetError) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The order could not be saved to the online order system. Please try again later or contact us directly.",
        },
        { status: 503 }
      );
    }

    // Prepare response for WhatsApp integration
    return NextResponse.json(
      {
        success: true,

        order: {
          id: order.id,
          createdAt: order.createdAt,
          itemsTotal: order.itemsTotal,
          personName: shipping.fullName,
          phone: shipping.phone,
          email: customerEmail,
          items: order.items,
          productsWanted: productsWanted,
          spreadsheetError,
        },

        sellerWhatsApp: "919043891268",
      },
      { status: 201 }
    );

  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Could not place order.";

    console.error("Order submission failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 400 }
    );
  }
}
