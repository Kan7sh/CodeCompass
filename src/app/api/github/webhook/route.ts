import { db } from "@/db/db";
import { UserTable } from "@/db/schema";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

const HF_TOKEN = process.env.NEXT_PUBLIC_HUGGINGFACE_API_KEY; // Hugging Face Inference API key

export async function POST(req: NextRequest) {
  console.log("Webhook POST endpoint hit");

  const body = await req.json();
  console.log("Incoming webhook payload:", JSON.stringify(body, null, 2));

  // Only handle PR open events
  if (body.action === "opened" && body.pull_request?.base?.ref === "master") {
    console.log("PR opened on master detected ✅");

    const prNumber = body.pull_request.number;
    const repoFull = body.repository.full_name;
    const [owner, repo] = repoFull.split("/");
    const githubUsername = body.pull_request.user.login;
    console.log("PR opened by:", githubUsername);

    const [user] = await db
      .select()
      .from(UserTable)
      .where(eq(UserTable.githubId, githubUsername));

    if (!user) {
      console.error("No user found in DB for GitHub username:", githubUsername);
      return NextResponse.json(
        { error: "User not authorized" },
        { status: 401 }
      );
    }

    const GITHUB_TOKEN = user.accessToken;

    console.log(`Processing PR #${prNumber} in repo ${repoFull}`);

    // 1. Get diff/changed files
    const filesRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/files`,
      {
        headers: { Authorization: `token ${GITHUB_TOKEN}` },
      }
    );

    const files = await filesRes.json();
    console.log("Changed files received:", files);

    // 2. Prepare content for AI
    const reviewInput = files
      .map((f: any) => `File: ${f.filename}\nPatch:\n${f.patch}\n`)
      .join("\n---\n");

    console.log("Review input prepared for Hugging Face:", reviewInput);

    // 3. Call Hugging Face router OpenAI-compatible API with Qwen model
    console.log("Sending diff to Hugging Face Qwen model...");
    const hfRes = await fetch(
      "https://router.huggingface.co/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${HF_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "Qwen/Qwen3-Coder-30B-A3B-Instruct:fireworks-ai",
          messages: [
            {
              role: "user",
              content: `You are a code reviewer. Review the following PR diff and suggest improvements or highlight issues:\n\n${reviewInput}`,
            },
          ],
        }),
      }
    );

    console.log("Hugging Face response status:", hfRes.status);
    const hfData = await hfRes.json();
    console.log("Hugging Face raw response:", hfData);

    const reviewText =
      hfData?.choices?.[0]?.message?.content ||
      "AI review could not be generated.";
    console.log("Final AI review text:", reviewText);

    // 4. Post review comment back to GitHub
    const commentRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/issues/${prNumber}/comments`,
      {
        method: "POST",
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ body: reviewText }),
      }
    );

    console.log("GitHub comment API response status:", commentRes.status);
    const commentData = await commentRes.json();
    console.log("Comment API response body:", commentData);

    console.log("✅ Posted AI review to PR successfully.");
  } else {
    console.log("Ignored webhook event (not PR opened on master).");
  }

  return NextResponse.json({ status: "ok" });
}
