// Minimal Apify client: start an actor run with a spend cap, wait for it,
// return the dataset items and what the run cost.

const API = 'https://api.apify.com/v2';

export function apifyReady() {
  return Boolean(process.env.APIFY_TOKEN);
}

async function call(pathname, opts = {}) {
  const res = await fetch(`${API}${pathname}`, {
    ...opts,
    headers: { Authorization: `Bearer ${process.env.APIFY_TOKEN}`, 'Content-Type': 'application/json', ...(opts.headers || {}) },
  });
  if (!res.ok) throw new Error(`apify ${pathname.split('?')[0]} ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

export async function runActor(actor, input, { maxUsd = 0.4, timeoutSec = 600 } = {}) {
  const id = actor.replace('/', '~');
  // Pay-per-event actors refuse a cap under $0.50 (clockworks/tiktok-scraper,
  // 2026-10-25). It's a ceiling, not a charge: runs cost what they return.
  maxUsd = Math.max(0.5, maxUsd);
  const started = await call(`/acts/${id}/runs?maxTotalChargeUsd=${maxUsd}&timeout=${timeoutSec}`, {
    method: 'POST', body: JSON.stringify(input),
  });
  let run = started.data;
  const deadline = Date.now() + (timeoutSec + 60) * 1000;
  while (!['SUCCEEDED', 'FAILED', 'ABORTED', 'TIMED-OUT'].includes(run.status)) {
    if (Date.now() > deadline) throw new Error(`apify ${actor} did not finish in time`);
    run = (await call(`/actor-runs/${run.id}?waitForFinish=60`)).data;
  }
  // A run that hits its spend cap ends ABORTED or SUCCEEDED with partial data;
  // either way the items it got are real, so keep them.
  const items = await call(`/datasets/${run.defaultDatasetId}/items?clean=true&format=json`);
  const list = Array.isArray(items) ? items : [];
  // Pay-per-result actors don't always report the result charge in
  // usageTotalUsd, so budget on the larger of that and the list rate
  // (~$2.70 per 1,000 on the free plan, the worst tier).
  const usd = Math.max(Number(run.usageTotalUsd || 0), list.length * 0.0027);
  return { items: list, usd, status: run.status, runId: run.id };
}
