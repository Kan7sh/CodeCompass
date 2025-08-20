"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import { signIn, useSession } from "next-auth/react";

export default function Home() {
  const signInWithGithub = async () => {
    const res = await signIn("github", { redirect: false });
    console.log(res);
  };

  return (
    <div className="flex  h-screen w-screen items-center justify-center">
      <Button onClick={signInWithGithub}>Login with Github</Button>
    </div>
  );
}
