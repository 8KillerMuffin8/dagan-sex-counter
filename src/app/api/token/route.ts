import { NextResponse } from "next/server";
import { generateSubmissionToken } from "@/lib/security/token";

export async function GET() {
  const token = generateSubmissionToken();
  return NextResponse.json({ token });
}
