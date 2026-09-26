import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { getUsersCollection } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  if (!ObjectId.isValid(userId)) {
    return new NextResponse(null, { status: 404 });
  }

  const users = await getUsersCollection();
  const user = await users.findOne(
    { _id: new ObjectId(userId) },
    { projection: { avatarData: 1 } }
  );

  const avatarData = (user as { avatarData?: string } | null)?.avatarData;
  if (!avatarData) {
    return new NextResponse(null, { status: 404 });
  }

  return new NextResponse(Buffer.from(avatarData, "base64"), {
    status: 200,
    headers: {
      "Content-Type": "image/webp",
      "Cache-Control": "private, no-cache, max-age=0, must-revalidate",
      "X-Content-Type-Options": "nosniff",
    },
  });
}