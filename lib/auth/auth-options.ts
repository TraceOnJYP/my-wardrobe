import { PrismaAdapter } from "@auth/prisma-adapter";
import type { NextAuthConfig } from "next-auth";
import { prisma } from "@/lib/prisma/client";
import { buildAuthProviders } from "@/lib/auth/provider-config";
import { authService } from "@/server/services/auth.service";

export const authOptions: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "database",
  },
  pages: {
    signIn: "/zh-CN/login",
    error: "/zh-CN/auth/error",
  },
  providers: buildAuthProviders(),
  callbacks: {
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.locale = user.locale === "en_US" ? "en-US" : "zh-CN";
        session.user.displayName = user.displayName ?? null;
        session.user.avatarUrl = user.avatarUrl ?? null;
      }

      return session;
    },
    authorized({ auth }) {
      return !!auth?.user;
    },
  },
  events: {
    async signIn({ user }) {
      await authService.migrateDemoDataToUser(user.id);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          lastLoginAt: new Date(),
          displayName: user.name ?? undefined,
          avatarUrl: user.image ?? undefined,
        },
      });
    },
  },
};
