import { db } from "@/db/db";
import { UserTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextAuthOptions } from "next-auth";

import GitHubProvider from "next-auth/providers/github";

export const AuthOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
      }

      return true;
    },
    async jwt({ trigger, token, user, account }) {
      if (account) {
        1;
        console.log(account.access_token);
        token.accessToken = account.access_token;
      }
      // if (trigger === "update" || account?.provider === "google" || user) {
      //   const email = user?.email || token.email;
      //   if (email) {
      //     const dbUser = await db.query.UserTable.findFirst({
      //       where: eq(UserTable.email, email as string),
      //     });

      //     if (dbUser) {
      //       token.id = dbUser.id;
      //       token.name = dbUser.name;
      //       token.email = dbUser.email;
      //       token.picture = dbUser.imageUrl;
      //     }
      //   }
      // }

      if (user && !account?.provider) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user = {
          ...session.user,
          id: token.id as string,
          name: token.name as string,
          email: token.email as string,
          image: token.picture as string,
          accessToken: token.accessToken as string,
        };
      }
      return session;
    },
  },
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "read:user repo",
        },
      },
    }),
  ],
};
