import { getServerSession } from "next-auth";
import { AuthOptions } from "@/lib/authOptions"

export async function GET() {
  const session = await getServerSession(AuthOptions);

  if (!session?.user.accessToken) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), { status: 401 });
  }

  const res = await fetch("https://api.github.com/user/repos", {
    headers: {
      Authorization: `token ${session.user.accessToken}`,
    },
  });

  const repos = await res.json();

  return new Response(JSON.stringify(repos), { status: 200 });
}
