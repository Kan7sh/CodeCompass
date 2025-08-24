"use client";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { signIn, signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
  const router = useRouter();
  const { data: session } = useSession();
  const [repos, setRepos] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<any | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [loadingRepoId, setLoadingRepoId] = useState<number | null>(null);

  const signInWithGithub = async () => {
    await signIn("github", { redirect: false });
  };

  const getRepo = async () => {
    console.log(session!.user.accessToken);
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

  const goToRepos = () => {
    router.push("/repositories");
  };

  const loadBranches = async (repo: any) => {
    if (!session?.user.accessToken) return;
    const [owner, repoName] = repo.full_name.split("/");

    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repoName}/branches`,
      {
        headers: {
          Authorization: `token ${session.user.accessToken}`,
        },
      }
    );
    const data = await res.json();
    setBranches(data);
    setSelectedRepo(repo);
    setSelectedBranch(null);
  };

  const createWebhook = async () => {
    if (!session?.user.accessToken || !selectedRepo || !selectedBranch) return;
    setLoadingRepoId(selectedRepo.id);

    const [owner, repoName] = selectedRepo.full_name.split("/");

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
            url: "https://bf93beeddf92.ngrok-free.app/api/github/webhook",
            content_type: "json",
            secret: "super-secret",
            insecure_ssl: "0",
          },
        }),
      }
    );

    console.log(res);
    const data = await res.json();
    console.log(data);

    setLoadingRepoId(null);

    if (res.ok) {
      alert(
        `Webhook created for ${selectedRepo.full_name} on branch ${selectedBranch} 🎉`
      );
    } else {
      alert(`Failed: ${data.message}`);
    }
  };

  return (
    <div className="h-screen w-screen font-mono ">
      <div className="flex flex-row gap-10 justify-center items-center p-5">
        {session && (
          <div className="cursor-pointer hover:underline" onClick={goToRepos}>
            Repositories
          </div>
        )}
        <div>About</div>

        {!session && (
          <Button onClick={signInWithGithub}>Login with GitHub</Button>
        )}
        {session && (
          <Popover>
            <PopoverTrigger>
              <img
                src={session.user?.image || ""}
                alt="avatar"
                className="w-12 h-12 rounded-full border"
              />
            </PopoverTrigger>
            <PopoverContent>
              <div className="flex flex-col">
                <div>{session.user.name}</div>
                <div className="text-neutral-600 mb-2">
                  {session.user.githubUsername}
                </div>
                <Button onClick={logout}>Logout</Button>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
     
    </div>
  );

  // return (
  //   <div className="flex flex-col h-screen w-screen items-center justify-start bg-gray-50 p-6">
  //     {/* Header */}
  //     <div className="w-full max-w-2xl text-center mb-10">
  //       <h1 className="text-3xl font-bold mb-2">GitHub Repo Viewer</h1>
  //       <p className="text-gray-600">
  //         Login with GitHub to view and manage your repositories.
  //       </p>
  //     </div>

  //     {/* Auth Section */}
  //     {!session ? (
  //       <Button onClick={signInWithGithub} size="lg" className="mb-6">
  //         Login with GitHub
  //       </Button>
  //     ) : (
  //       <div className="flex flex-col items-center gap-4 w-full max-w-2xl mb-10">
  //         {/* Profile */}
  //         <div className="flex items-center gap-3 bg-white p-4 rounded-xl shadow w-full">
  //           <img
  //             src={session.user?.image || ""}
  //             alt="avatar"
  //             className="w-12 h-12 rounded-full border"
  //           />
  //           <div className="text-left">
  //             <p className="font-semibold">{session.user?.name}</p>
  //             <p className="text-sm text-gray-500">{session.user?.email}</p>
  //           </div>
  //         </div>

  //         {/* Actions */}
  //         <div className="flex gap-3">
  //           <Button variant="secondary" onClick={getRepo}>
  //             Load Repos
  //           </Button>
  //           <Button variant="destructive" onClick={logout}>
  //             Logout
  //           </Button>
  //         </div>
  //       </div>
  //     )}

  //     {/* Repo List */}
  //     {repos.length > 0 && (
  //       <div className="w-full max-w-4xl">
  //         <h2 className="text-xl font-semibold mb-4 text-center">
  //           Your Repositories
  //         </h2>
  //         <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
  //           {repos.map((repo) => (
  //             <li
  //               key={repo.id}
  //               className="bg-white border rounded-2xl p-4 shadow hover:shadow-md transition flex flex-col justify-between"
  //             >
  //               <div>
  //                 <a
  //                   href={repo.html_url}
  //                   target="_blank"
  //                   className="text-lg font-semibold text-blue-600 hover:underline"
  //                 >
  //                   {repo.name}
  //                 </a>
  //                 <p className="text-sm text-gray-600 mt-1 line-clamp-2">
  //                   {repo.description || "No description"}
  //                 </p>
  //               </div>

  //               <div className="mt-4 flex justify-between items-center">
  //                 <Button
  //                   size="sm"
  //                   onClick={() => loadBranches(repo)}
  //                   disabled={loadingRepoId === repo.id}
  //                 >
  //                   {loadingRepoId === repo.id ? "Loading..." : "Select Repo"}
  //                 </Button>
  //               </div>
  //             </li>
  //           ))}
  //         </ul>
  //       </div>
  //     )}

  //     {/* Branch selection + webhook creation */}
  //     {selectedRepo && branches.length > 0 && (
  //       <div className="mt-10 bg-white p-6 rounded-xl shadow max-w-xl w-full">
  //         <h3 className="text-lg font-semibold mb-3">
  //           Select Branch for {selectedRepo.name}
  //         </h3>
  //         <select
  //           value={selectedBranch || ""}
  //           onChange={(e) => setSelectedBranch(e.target.value)}
  //           className="border rounded p-2 w-full mb-4"
  //         >
  //           <option value="">-- Select Branch --</option>
  //           {branches.map((b) => (
  //             <option key={b.name} value={b.name}>
  //               {b.name}
  //             </option>
  //           ))}
  //         </select>

  //         <Button
  //           size="lg"
  //           onClick={createWebhook}
  //           disabled={!selectedBranch || loadingRepoId === selectedRepo.id}
  //         >
  //           {loadingRepoId === selectedRepo.id
  //             ? "Creating Webhook..."
  //             : "Create Webhook"}
  //         </Button>
  //       </div>
  //     )}
  //   </div>
  // );
}
