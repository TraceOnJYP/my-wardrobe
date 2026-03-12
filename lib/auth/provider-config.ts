import Apple from "next-auth/providers/apple";
import Google from "next-auth/providers/google";
import type { Provider } from "next-auth/providers";

export type AuthProviderId = "google" | "apple" | "wechat";

export type LoginProviderConfig = {
  id: AuthProviderId;
  status: "enabled" | "not_configured" | "planned";
  label: {
    "zh-CN": string;
    "en-US": string;
  };
  description: {
    "zh-CN": string;
    "en-US": string;
  };
};

export function getLoginProviders(): LoginProviderConfig[] {
  return [
    {
      id: "google",
      status:
        process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? "enabled" : "not_configured",
      label: {
        "zh-CN": "使用 Google 登录",
        "en-US": "Continue with Google",
      },
      description: {
        "zh-CN": "适合国际化 Web 登录。",
        "en-US": "Best for international web access.",
      },
    },
    {
      id: "apple",
      status:
        process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET ? "enabled" : "not_configured",
      label: {
        "zh-CN": "使用 Apple 登录",
        "en-US": "Continue with Apple",
      },
      description: {
        "zh-CN": "未来 iOS 扩展的优先方式。",
        "en-US": "Preferred for future iOS support.",
      },
    },
    {
      id: "wechat",
      status: "planned",
      label: {
        "zh-CN": "使用微信登录",
        "en-US": "Continue with WeChat",
      },
      description: {
        "zh-CN": "已完成方案设计，后续版本接入。",
        "en-US": "Planned in the next implementation phase.",
      },
    },
  ];
}

export function buildAuthProviders(): Provider[] {
  const providers: Provider[] = [];

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    providers.push(
      Google({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      }),
    );
  }

  if (process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET) {
    providers.push(
      Apple({
        clientId: process.env.APPLE_CLIENT_ID,
        clientSecret: process.env.APPLE_CLIENT_SECRET,
      }),
    );
  }

  return providers;
}

export function isAuthConfigured() {
  return Boolean(process.env.AUTH_SECRET && buildAuthProviders().length > 0);
}
