import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(
  _: VercelRequest,
  response: VercelResponse,
): void {
  response.status(302).setHeader("Location", "https://github.com/gschz").end();
}
