import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  session: {
    strategy: "jwt", // use JWT-based sessions
  },
  providers: [
    CredentialsProvider({
      name: "Dev Login",
      credentials: {
        email: {
          label: "Email",
          type: "text",
          placeholder: "dev@example.com",
        },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;

        // Create or get the dev user
        const user = await prisma.user.upsert({
          where: { email: credentials.email },
          update: {},
          create: {
            email: credentials.email,
            name: "Dev User",
            plan: "pro",
          },
        });

        // NextAuth expects something with at least an id
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          plan: user.plan,
        } as any;
      },
    }),
  ],
  callbacks: {
    // Runs whenever a JWT is created/updated
    async jwt({ token, user }) {
      // On initial sign-in, `user` exists
      if (user) {
        token.id = (user as any).id;
        token.email = user.email;
        token.name = user.name;
        (token as any).plan = (user as any).plan ?? "free";
      }
      return token;
    },

    // Runs whenever `getServerSession` or `useSession` is called
    async session({ session, token }) {
      if (session.user) {
        session.user.name = token.name as string | undefined;
        session.user.email = token.email as string | undefined;
        // @ts-expect-error – add custom fields
        session.user.id = token.id;
        // @ts-expect-error – add custom fields
        session.user.plan = (token as any).plan;
      }
      return session;
    },
  },
  debug: true,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
