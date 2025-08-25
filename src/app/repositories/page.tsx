"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";

type Repo = {
  id: number;
  name: string;
  description: string | null;
  html_url: string;
  owner: { login: string };
};

type Branch = {
  name: string;
};

type MonitoringRecord = {
  id: number;
  userId: number;
  repoName: string;
  branchName: string;
};

export default function RepositoriesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [repos, setRepos] = useState<Repo[]>([]);
  const [isReposLoading, setReposLoading] = useState(false);

  const [openDialog, setOpenDialog] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<Repo | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isBranchesLoading, setBranchesLoading] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [customPrompt, setCustomPrompt] = useState<string>(""); // <-- new state

  const [activeRepos, setActiveRepos] = useState<MonitoringRecord[]>([]);

  async function logout() {
    await signOut();
    router.push("/");
  }

  useEffect(() => {
    if (status === "authenticated") {
      getRepos();
      getActiveRepos();
    }
  }, [status]);

  const getRepos = async () => {
    if (!session?.user?.accessToken) return;
    try {
      setReposLoading(true);
      const res = await fetch("https://api.github.com/user/repos", {
        headers: {
          Authorization: `token ${session.user.accessToken as string}`,
        },
      });
      const data: Repo[] = await res.json();
      setRepos(data);
    } catch (error) {
      console.error("Error fetching repos", error);
    } finally {
      setReposLoading(false);
    }
  };

  const getActiveRepos = async () => {
    if (!session?.user?.id) return;
    try {
      const res = await fetch(`/api/monitoring?userId=${session.user.id}`);
      const data: MonitoringRecord[] = await res.json();
      setActiveRepos(data);
    } catch (error) {
      console.error("Error fetching active repos", error);
    }
  };

  const openBranchDialog = async (repo: Repo) => {
    setSelectedRepo(repo);
    setBranches([]);
    setSelectedBranch("");
    setCustomPrompt("");
    setBranchesLoading(true);
    setOpenDialog(true);

    try {
      const res = await fetch(
        `https://api.github.com/repos/${repo.owner.login}/${repo.name}/branches`,
        {
          headers: {
            Authorization: `token ${session?.user?.accessToken as string}`,
          },
        }
      );
      const data: Branch[] = await res.json();
      setBranches(data);
    } catch (error) {
      console.error("Error fetching branches", error);
    } finally {
      setBranchesLoading(false);
    }
  };

  const createWebhook = async () => {
    if (!session?.user.accessToken || !selectedRepo || !selectedBranch) return;

    const [owner, repoName] = [selectedRepo.owner.login, selectedRepo.name];

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
            url: `https://f8eef3ce8ba5.ngrok-free.app/api/github/webhook`,
            content_type: "json",
            secret: "super-secret",
            insecure_ssl: "0",
          },
        }),
      }
    );

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || "Failed to create webhook");
    }

    return data.id as number; // return webhookId
  };

  const handleStartMonitoring = async ({
    repo,
    branch,
  }: {
    repo: string;
    branch: string;
  }) => {
    if (!selectedRepo || !selectedBranch) return;

    try {
      const webhookId = await createWebhook(); // capture webhookId

      await fetch("/api/monitoring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session?.user.id,
          repoName: `${selectedRepo.owner.login}/${repo}`, // store with owner
          branchName: branch,
          webhookId,
          customPrompt,
        }),
      });

      setOpenDialog(false);
      getActiveRepos();
    } catch (err) {
      console.error("Start monitoring failed:", err);
      alert("Failed to start monitoring");
    }
  };

  const handleDeleteMonitoring = async (id: number) => {
    await fetch(`/api/monitoring?id=${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${session?.user.accessToken}`,
      },
    });
    getActiveRepos();
  };

  return (
    <div className="h-screen w-screen font-mono">
      {/* Navbar */}
      <div className="flex flex-row gap-10 justify-center items-center p-5">
        <div
          className="cursor-pointer hover:underline"
          onClick={() => router.push("/")}
        >
          Home
        </div>
        <div>About</div>
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
                <div>{session.user?.name}</div>
                <div className="text-neutral-600 mb-2">
                  {(session.user as any).githubUsername}
                </div>
                <Button onClick={logout}>Logout</Button>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>

      <div className="flex flex-col p-8 space-y-10">
        {/* Active Monitoring Section */}
        {activeRepos.length > 0 && (
          <div>
            <div className="text-2xl mb-4">Active Monitoring</div>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeRepos.map((active) => (
                <li
                  key={active.id}
                  className="bg-white border rounded-2xl p-4 shadow hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    <div className="text-lg font-semibold text-green-700">
                      {active.repoName}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Branch: {active.branchName}
                    </p>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Button
                      variant="destructive"
                      onClick={() => handleDeleteMonitoring(active.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Repositories Section */}
        <div>
          <div className="text-2xl mb-4">Your Repositories</div>
          {isReposLoading && (
            <div className="text-center text-gray-600">
              Loading repositories...
            </div>
          )}

          {!isReposLoading &&
            repos.length === 0 &&
            status === "authenticated" && (
              <div className="text-center text-gray-600">
                No repositories found.
              </div>
            )}

          {!isReposLoading && repos.length > 0 && (
            <div className="w-full">
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {repos
                  .filter(
                    (r) => !activeRepos.some((a) => a.repoName === r.name)
                  )
                  .map((repo) => (
                    <li
                      key={repo.id}
                      className="bg-white border rounded-2xl p-4 shadow hover:shadow-md transition flex flex-col justify-between"
                    >
                      <div>
                        <a
                          href={repo.html_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-lg font-semibold text-blue-600 hover:underline"
                        >
                          {repo.name}
                        </a>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {repo.description || "No description"}
                        </p>
                      </div>
                      <div className="mt-4 flex justify-between items-center">
                        <Button onClick={() => openBranchDialog(repo)}>
                          Monitor
                        </Button>
                      </div>
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Branch Selection Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Select Branch for {selectedRepo?.name || ""}
            </DialogTitle>
          </DialogHeader>

          {isBranchesLoading && (
            <div className="text-center text-gray-600">Loading branches...</div>
          )}

          {!isBranchesLoading && branches.length > 0 && (
            <RadioGroup
              value={selectedBranch}
              onValueChange={(val: string) => setSelectedBranch(val)}
              className="space-y-2 mt-4"
            >
              {branches.map((branch) => (
                <div
                  key={branch.name}
                  className="flex items-center space-x-2 border p-2 rounded-lg"
                >
                  <RadioGroupItem value={branch.name} id={branch.name} />
                  <Label htmlFor={branch.name}>{branch.name}</Label>
                </div>
              ))}
            </RadioGroup>
          )}

          {!isBranchesLoading && branches.length === 0 && (
            <div className="text-gray-600">No branches found.</div>
          )}

          {/* Custom prompt input */}
          <div className="mt-4">
            <Label htmlFor="customPrompt">
              Instructions for code review (optional)
            </Label>
            <Textarea
              id="customPrompt"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="e.g. Focus on performance, security best practices, or readability..."
              className="mt-2"
            />
          </div>

          <DialogFooter className="mt-4">
            <Button
              onClick={() =>
                handleStartMonitoring({
                  repo: selectedRepo?.name || "",
                  branch: selectedBranch,
                })
              }
              disabled={!selectedBranch}
            >
              Start Monitoring
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
