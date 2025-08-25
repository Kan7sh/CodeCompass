"use client";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { signIn, signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const { data: session } = useSession();

  const signInWithGithub = async () => {
    await signIn("github", { redirect: false });
  };

  async function logout() {
    await signOut();
  }

  const goToRepos = () => {
    router.push("/repositories");
  };

  return (
    <div className="h-screen w-screen font-mono">
      {/* Navbar with dotted underline */}
      <div
        className="flex flex-row gap-10 justify-between items-center p-5 border-b"
        style={{
          borderBottom: "10px dotted black", // makes the dots bigger and wider
        }}
      >
        {" "}
        <div>code compass</div>
        <div className="flex flex-row gap-7">
          {session && (
            <div className="cursor-pointer hover:underline" onClick={goToRepos}>
              Repositories
            </div>
          )}
          <div>About</div>
        </div>
        {!session && (
          <Button onClick={signInWithGithub}>Login with GitHub</Button>
        )}
        {session && (
          <Popover>
            <PopoverTrigger>
              <img
                src={session.user?.image || ""}
                alt="avatar"
                className="w-8 h-8 rounded-full border"
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
}
