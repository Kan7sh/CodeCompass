import NextAuth, { DefaultSession } from "next-auth";
import { AuthOptions } from "../../../../lib/authOptions";

const handler = NextAuth(AuthOptions);

  declare module "next-auth" {
    interface Session extends DefaultSession {
      user: {
        id: string;
        name: string;
        email: string;
        accessToken:string;
      } & DefaultSession["user"];
    }
  }

export { handler as GET, handler as POST };
