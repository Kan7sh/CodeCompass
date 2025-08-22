"use client";

import { Button } from "@/components/ui/button";
import { signIn, signOut, useSession } from "next-auth/react";
import { useState } from "react";

export default function Home() {
  const { data: session } = useSession();
  const [repos, setRepos] = useState<any[]>([]);
  const [loadingRepoId, setLoadingRepoId] = useState<number | null>(null);

  const signInWithGithub = async () => {
    await signIn("github", { redirect: false });
  };

  const getRepo = async () => {
    if (!session) return;
    const res = await fetch("https://api.github.com/user/repos", {
      headers: {
        Authorization: `token ${session.user.accessToken}`,
      },
    });
    const data = await res.json();
    setRepos(data);
  };

  async function logout() {
    await signOut();
  }

  // 👉 Create Webhook for a repo
  const createWebhook = async (repo: any) => {
    if (!session?.user.accessToken) return;
    setLoadingRepoId(repo.id);

    const [owner, repoName] = repo.full_name.split("/");

    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repoName}/hooks`,
      {
        method: "POST",
        headers: {
          Authorization: `token ${session.user.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "web",
          active: true,
          events: ["pull_request"], 
          config: {
            url: "https://bb5c492b053a.ngrok-free.app/api/github/webhook", 
            content_type: "json",
            secret: "super-secret", 
            insecure_ssl: "0",
          },
        }),
      }
    );

    const data = await res.json();
    setLoadingRepoId(null);

    if (res.ok) {
      alert(`Webhook created for ${repo.full_name} 🎉`);
    } else {
      alert(`Failed: ${data.message}`);
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen items-center justify-start bg-gray-50 p-6">
      {/* Header */}
      <div className="w-full max-w-2xl text-center mb-10">
        <h1 className="text-3xl font-bold mb-2">GitHub Repo Viewer</h1>
        <p className="text-gray-600">
          Login with GitHub to view and manage your repositories.
        </p>
      </div>

      {/* Auth Section */}
      {!session ? (
        <Button onClick={signInWithGithub} size="lg" className="mb-6">
          Login with GitHub
        </Button>
      ) : (
        <div className="flex flex-col items-center gap-4 w-full max-w-2xl mb-10">
          {/* Profile */}
          <div className="flex items-center gap-3 bg-white p-4 rounded-xl shadow w-full">
            <img
              src={session.user?.image || ""}
              alt="avatar"
              className="w-12 h-12 rounded-full border"
            />
            <div className="text-left">
              <p className="font-semibold">{session.user?.name}</p>
              <p className="text-sm text-gray-500">{session.user?.email}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="secondary" onClick={getRepo}>
              Load Repos
            </Button>
            <Button variant="destructive" onClick={logout}>
              Logout
            </Button>
          </div>
        </div>
      )}

      {/* Repo List */}
      {repos.length > 0 && (
        <div className="w-full max-w-4xl">
          <h2 className="text-xl font-semibold mb-4 text-center">
            Your Repositories
          </h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {repos.map((repo) => (
              <li
                key={repo.id}
                className="bg-white border rounded-2xl p-4 shadow hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <a
                    href={repo.html_url}
                    target="_blank"
                    className="text-lg font-semibold text-blue-600 hover:underline"
                  >
                    {repo.name}
                  </a>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {repo.description || "No description"}
                  </p>
                </div>

                <div className="mt-4 flex justify-between items-center">
                  <div className="flex gap-4 text-sm text-gray-500">
                    <span>⭐ {repo.stargazers_count}</span>
                    <span>🍴 {repo.forks_count}</span>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => createWebhook(repo)}
                    disabled={loadingRepoId === repo.id}
                  >
                    {loadingRepoId === repo.id
                      ? "Creating..."
                      : "Create Webhook"}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
