import { NextRequest, NextResponse } from "next/server";
import * as Checkout from "@/lib/checkout";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const channel = searchParams.get("channel");
    
    if (!channel) {
      return NextResponse.json({ count: 0 }, { status: 200 });
    }

    const checkoutId = await Checkout.getIdFromCookies(channel);
    if (!checkoutId) {
      return NextResponse.json({ count: 0 }, { status: 200 });
    }

    const checkout = await Checkout.find(checkoutId);
    if (!checkout) {
      return NextResponse.json({ count: 0 }, { status: 200 });
    }

    const count = checkout.lines.reduce((sum, line) => sum + line.quantity, 0);
    return NextResponse.json({ count }, { status: 200 });
  } catch (error) {
    // Silently fail - return 0 count
    console.debug('[Cart Count API] Error:', error);
    return NextResponse.json({ count: 0 }, { status: 200 });
  }
}
