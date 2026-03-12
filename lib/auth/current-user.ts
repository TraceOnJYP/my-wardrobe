import { prisma } from "@/lib/prisma/client";
import { auth } from "@/lib/auth/auth";
import { isAuthConfigured } from "@/lib/auth/provider-config";

export async function getOptionalCurrentUser() {
  if (!isAuthConfigured()) {
    return null;
  }

  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  return prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      accounts: {
        select: {
          provider: true,
        },
      },
    },
  });
}

export async function requireCurrentUser() {
  const user = await getOptionalCurrentUser();

  if (!user) {
    throw new Error("UNAUTHORIZED");
  }

  return user;
}
