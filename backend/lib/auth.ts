import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  session: {
    strategy: "jwt",
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
            plan: "free",
          },
        });

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
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.email = user.email;
        token.name = user.name;
        (token as any).plan = (user as any).plan ?? "free";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.name = token.name as string | undefined;
        session.user.email = token.email as string | undefined;
        // @ts-expect-error – add custom fields
        session.user.id = (token as any).id;
        // @ts-expect-error – add custom fields
        session.user.plan = (token as any).plan;
      }
      return session;
    },
  },
  debug: true,
};
