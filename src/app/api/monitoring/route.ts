// app/api/monitoring/route.ts
import { NextResponse } from "next/server";
import { db } from "@/db/db";
import { MonitoringRepo } from "@/db/schema/monitoringRepo";
import { eq } from "drizzle-orm";

// Fetch active repos
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) return NextResponse.json([], { status: 400 });

  const data = await db
    .select()
    .from(MonitoringRepo)
    .where(eq(MonitoringRepo.userId, Number(userId)));
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const body = await req.json();
  await db.insert(MonitoringRepo).values({
    userId: Number(body.userId),
    repoName: body.repoName,
    branchName: body.branchName,
    webhookId: body.webhookId,
    customPrompt: body.customPrompt,
  });
  return NextResponse.json({ ok: true });
}

// Delete monitoring record
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const accessToken = req.headers.get("authorization"); // expect "Bearer <token>"

  if (!id) {
    return NextResponse.json(
      { ok: false, error: "Missing id" },
      { status: 400 }
    );
  }
  if (!accessToken) {
    return NextResponse.json(
      { ok: false, error: "Missing GitHub token" },
      { status: 401 }
    );
  }

  // 1. Find the record
  const [record] = await db
    .select()
    .from(MonitoringRepo)
    .where(eq(MonitoringRepo.id, Number(id)));

  if (!record) {
    return NextResponse.json(
      { ok: false, error: "Record not found" },
      { status: 404 }
    );
  }

  try {
    // 2. Delete webhook from GitHub
    const res = await fetch(
      `https://api.github.com/repos/${record.repoName}/hooks/${record.webhookId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken.replace("Bearer ", "")}`,
          Accept: "application/vnd.github+json",
        },
      }
    );

    if (!res.ok) {
      const err = await res.json();
      console.error("GitHub webhook delete failed:", err);
    }
  } catch (err) {
    console.error("Error deleting webhook:", err);
  }

  // 3. Delete from DB
  await db.delete(MonitoringRepo).where(eq(MonitoringRepo.id, Number(id)));

  return NextResponse.json({ ok: true });
}
