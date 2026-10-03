// GET /api/usage — quanto o cliente já usou no mês.
import { requireUser, send, fail, getUsage } from "./_lib/core.js";

export default async function handler(req, res) {
  try {
    const ctx = await requireUser(req);
    send(res, 200, await getUsage(ctx));
  } catch (e) { fail(res, e); }
}
