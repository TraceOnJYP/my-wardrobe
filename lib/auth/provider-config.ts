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
      status:
        process.env.WECHAT_CLIENT_ID && process.env.WECHAT_CLIENT_SECRET ? "enabled" : "not_configured",
      label: {
        "zh-CN": "使用微信登录",
        "en-US": "Continue with WeChat",
      },
      description: {
        "zh-CN": "适合中国大陆用户的扫码登录。",
        "en-US": "QR sign-in for mainland China users.",
      },
    },
  ];
}

function WeChatProvider(): Provider {
  const scope = process.env.WECHAT_SCOPE || "snsapi_login";

  return {
    id: "wechat",
    name: "WeChat",
    type: "oauth",
    checks: ["state"],
    authorization: {
      url: "https://open.weixin.qq.com/connect/qrconnect",
      params: {
        appid: process.env.WECHAT_CLIENT_ID ?? "",
        scope,
        response_type: "code",
      },
    },
    token: {
      async request(context) {
        const code = typeof context.params.code === "string" ? context.params.code : "";
        const searchParams = new URLSearchParams({
          appid: context.provider.clientId ?? "",
          secret: context.provider.clientSecret ?? "",
          code,
          grant_type: "authorization_code",
        });
        const response = await fetch(`https://api.weixin.qq.com/sns/oauth2/access_token?${searchParams.toString()}`);
        const tokens = await response.json();

        if (!response.ok || tokens?.errcode) {
          throw new Error(tokens?.errmsg ?? "WeChat token exchange failed");
        }

        return {
          tokens: {
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            expires_at:
              typeof tokens.expires_in === "number"
                ? Math.floor(Date.now() / 1000) + tokens.expires_in
                : undefined,
            openid: tokens.openid,
            scope: tokens.scope,
          },
        };
      },
    },
    userinfo: {
      async request(context) {
        const accessToken = typeof context.tokens.access_token === "string" ? context.tokens.access_token : "";
        const openid = typeof context.tokens.openid === "string" ? context.tokens.openid : "";
        const searchParams = new URLSearchParams({
          access_token: accessToken,
          openid,
          lang: "zh_CN",
        });
        const response = await fetch(`https://api.weixin.qq.com/sns/userinfo?${searchParams.toString()}`);
        const profile = await response.json();

        if (!response.ok || profile?.errcode) {
          throw new Error(profile?.errmsg ?? "WeChat userinfo request failed");
        }

        return profile;
      },
    },
    profile(profile) {
      return {
        id: profile.unionid ?? profile.openid,
        name: profile.nickname ?? null,
        email: null,
        image: profile.headimgurl ?? null,
      };
    },
    clientId: process.env.WECHAT_CLIENT_ID,
    clientSecret: process.env.WECHAT_CLIENT_SECRET,
  } as Provider;
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

  if (process.env.WECHAT_CLIENT_ID && process.env.WECHAT_CLIENT_SECRET) {
    providers.push(WeChatProvider());
  }

  return providers;
}

export function isAuthConfigured() {
  return Boolean(process.env.AUTH_SECRET && buildAuthProviders().length > 0);
}
