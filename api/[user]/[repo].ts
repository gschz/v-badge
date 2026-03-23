import type { VercelRequest, VercelResponse } from "@vercel/node";

type EnvShape = {
  Bun?: {
    env?: Record<string, string | undefined>;
  };
};

function readEnv(name: string): string | undefined {
  const bunEnv = (globalThis as EnvShape).Bun?.env;
  return bunEnv?.[name] ?? process.env[name];
}

function parseWhitelist(): Set<string> {
  const whitelist = readEnv("WHITELIST");
  if (!whitelist) {
    return new Set();
  }
  return new Set(
    whitelist
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean),
  );
}

async function getVersion(user: string, repo: string): Promise<string> {
  const pat = readEnv("GITHUB_PAT") ?? readEnv("PAT") ?? readEnv("PAT_1");
  const githubUrl = `https://api.github.com/repos/${user}/${repo}/contents/package.json?ref=HEAD`;
  const baseHeaders = {
    Accept: "application/vnd.github+json",
    "User-Agent": "v-badge",
  } satisfies Record<string, string>;

  const fetchPackageJson = async (token?: string): Promise<Response> => {
    const headers = new Headers(baseHeaders);
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return fetch(githubUrl, { headers });
  };

  let response = await fetchPackageJson(pat);
  if ((response.status === 401 || response.status === 403) && pat) {
    response = await fetchPackageJson();
  }

  if (!response.ok) {
    if (response.status === 404) {
      throw [422, `package.json not available for ${user}/${repo}`] as const;
    }
    let responseMessage = `github status ${response.status}`;
    try {
      const errorPayload = (await response.json()) as { message?: unknown };
      if (typeof errorPayload.message === "string") {
        responseMessage = errorPayload.message;
      }
    } catch {
      responseMessage = `github status ${response.status}`;
    }
    throw [
      422,
      `package.json not available for ${user}/${repo}: ${responseMessage}`,
    ] as const;
  }

  const payload = (await response.json()) as {
    content?: string;
    encoding?: string;
  };
  if (payload.encoding !== "base64" || typeof payload.content !== "string") {
    throw [422, `invalid package.json payload for ${user}/${repo}`] as const;
  }

  const packageJson = Buffer.from(
    payload.content.replace(/\n/g, ""),
    "base64",
  ).toString("utf-8");
  const parsed = JSON.parse(packageJson) as { version?: unknown };
  if (typeof parsed.version !== "string" || parsed.version.length === 0) {
    throw [
      422,
      `valid version not found in package.json: found ${String(parsed.version)}`,
    ] as const;
  }
  return parsed.version;
}

async function svgBadge(
  user: string,
  repo: string,
): Promise<{
  statusCode: number;
  headers: Record<string, string>;
  body?: string;
}> {
  const svgFormat = /\.svg$/;
  if (!svgFormat.test(repo)) {
    throw [301, `/${user}/${repo}.svg`] as const;
  }

  const whitelist = parseWhitelist();
  if (whitelist.size > 0 && !whitelist.has(user)) {
    throw [403, `user ${user} is not in WHITELIST`] as const;
  }

  const repoSanitized = repo.replace(svgFormat, "");
  const version = await getVersion(user, repoSanitized);
  return {
    headers: {
      "cache-control":
        "no-cache, no-store, must-revalidate, max-age=0, s-maxage=0",
      "content-type": "image/svg+xml",
    },
    statusCode: 200,
    body: `<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="10">
      <text y="9" font-size="12" fill="#2d2d2d" font-family="Arial">
        v${version}
      </text>,
    </svg>`,
  };
}

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
): Promise<void> {
  const user = request.query.user;
  const repo = request.query.repo;
  const userValue = Array.isArray(user) ? user[0] : user;
  const repoValue = Array.isArray(repo) ? repo[0] : repo;
  const userValid = typeof userValue === "string" && userValue.length > 0;
  const repoValid = typeof repoValue === "string" && repoValue.length > 0;

  try {
    if (!userValid && !repoValid) {
      response.status(404).end();
      return;
    }
    if (!userValid) {
      response.status(400).send("user param not specified");
      return;
    }
    if (!repoValid) {
      response.status(400).send("repo param not specified");
      return;
    }

    const data = await svgBadge(userValue, repoValue);
    response.status(data.statusCode);
    for (const [header, value] of Object.entries(data.headers)) {
      response.setHeader(header, value);
    }
    response.send(data.body);
    return;
  } catch (error) {
    if (Array.isArray(error)) {
      const [statusCode, body] = error;
      if (statusCode === 301) {
        response.status(301).setHeader("Location", String(body)).end();
        return;
      }
      response.status(Number(statusCode)).send(String(body));
      return;
    }
  }

  response.status(418).send("i’m a teapot");
}
