import { brandVersion } from "./data.js";

// Every tool answers in one shape, so Claude can always tell success from
// failure and knows what to do next from error.fix.
export class BrandError extends Error {
  constructor(code, message, fix) {
    super(message);
    this.code = code;
    this.fix = fix;
  }
}

export function ok(data) {
  return { content: [{ type: "text", text: JSON.stringify({ ok: true, brand_version: brandVersion(), data }, null, 2) }] };
}

export function fail(err) {
  const error = err instanceof BrandError
    ? { code: err.code, message: err.message, fix: err.fix }
    : { code: "INTERNAL", message: String(err?.message ?? err), fix: "Retry once; if it fails again, report the message to the brand team." };
  return { isError: true, content: [{ type: "text", text: JSON.stringify({ ok: false, error, brand_version: brandVersion() }, null, 2) }] };
}

export const run = (fn) => async (args) => {
  try {
    return ok(await fn(args ?? {}));
  } catch (err) {
    return fail(err);
  }
};
