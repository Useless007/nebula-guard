import { getLogs } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const logs = await getLogs();
  return NextResponse.json(logs);
}