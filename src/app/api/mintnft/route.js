import { NextResponse } from "next/server";
import { main } from "@/app/solananft";

export async function POST(request) {
  const data = await request.json();

  const recipient = data.recipient;

  await main(recipient);

  return NextResponse.json({ status: "success" });
}
