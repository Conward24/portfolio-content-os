/**
 * Daily Pulse → Content OS forwarder
 * Google Apps Script. Runs on the michael@debenservices.com account.
 *
 * WHY THIS AND NOT A CLAUDE GMAIL CONNECTION:
 * Connecting the inbox to Claude lets someone *read* pulses on request. It does not build a
 * baseline. The tier engine needs one reading per topic per day, every day, accumulating for
 * 14 days before it scores anything — that has to run whether or not anyone is at a keyboard.
 * This script is the pipeline; a Claude connection is just a window onto it.
 *
 * SETUP (about five minutes, all on the deben account)
 *  1. Sign in to script.google.com AS michael@debenservices.com. This matters — the script
 *     reads whichever mailbox owns it.
 *  2. New project, paste this file in.
 *  3. Project Settings → Script Properties, add two:
 *       INGEST_URL     https://<your-production-domain>/api/ingest/blabbing
 *       INGEST_SECRET  <the same value as BLABBING_INGEST_SECRET in Vercel>
 *     Get the domain from the Vercel dashboard (project: portfolio-content-os → Domains).
 *     Do NOT hardcode the secret in the file body.
 *  4. Run `testOnce` manually. Google will prompt for Gmail + external-request permission.
 *     Check the execution log — it prints what it found and what the endpoint returned.
 *  5. Triggers → Add Trigger → forwardDailyPulses → Time-driven → Day timer → 12–1pm.
 *     The pulses arrive around 11am ET, so early afternoon catches the full set.
 *
 * IDEMPOTENCE: every processed thread gets the label below, and the search excludes it.
 * Re-running is safe and will not double-post. The store also dedups on message id.
 */

var LABEL = 'ContentOS/Ingested';
var SEARCH = 'from:notifications@appuser.io subject:"Daily Pulse" newer_than:2d';

function prop_(key) {
  var v = PropertiesService.getScriptProperties().getProperty(key);
  if (!v) throw new Error('Missing Script Property: ' + key);
  return v;
}

function getOrCreateLabel_() {
  return GmailApp.getUserLabelByName(LABEL) || GmailApp.createLabel(LABEL);
}

/**
 * Main entry point. Finds unprocessed Daily Pulse emails and posts each raw message to the
 * ingest endpoint. One request per message so a single malformed email cannot sink the batch.
 */
function forwardDailyPulses() {
  var url = prop_('INGEST_URL');
  var secret = prop_('INGEST_SECRET');
  var label = getOrCreateLabel_();

  var threads = GmailApp.search(SEARCH + ' -label:"' + LABEL + '"', 0, 50);
  Logger.log('Found %s unprocessed thread(s)', threads.length);
  if (!threads.length) return;

  var sent = 0, failed = 0;

  threads.forEach(function (thread) {
    var messages = thread.getMessages();
    var threadOk = true;

    messages.forEach(function (msg) {
      // getRawContent() gives the full RFC822 .eml, which is exactly what the endpoint's
      // `raw` path expects — headers, quoted-printable body, the lot. Do not pre-strip it;
      // the parser wants the headers for message id and date.
      var raw = msg.getRawContent();

      try {
        var res = UrlFetchApp.fetch(url, {
          method: 'post',
          contentType: 'application/json',
          headers: { 'X-B4B-Secret': secret },
          payload: JSON.stringify({ raw: raw }),
          muteHttpExceptions: true,
        });
        var code = res.getResponseCode();
        if (code >= 200 && code < 300) {
          sent++;
          Logger.log('OK   %s — %s', code, msg.getSubject());
        } else {
          failed++; threadOk = false;
          Logger.log('FAIL %s — %s — %s', code, msg.getSubject(), res.getContentText().slice(0, 300));
        }
      } catch (e) {
        failed++; threadOk = false;
        Logger.log('ERR  %s — %s', msg.getSubject(), e);
      }
    });

    // Only mark done if every message in the thread posted cleanly, so a failure is retried
    // on the next run rather than silently dropped.
    if (threadOk) thread.addLabel(label);
  });

  Logger.log('Done. sent=%s failed=%s', sent, failed);

  // Surface repeated failures rather than letting the baseline quietly stop filling.
  if (failed > 0 && sent === 0) {
    MailApp.sendEmail({
      to: Session.getEffectiveUser().getEmail(),
      subject: '[Content OS] Daily Pulse ingest failed',
      body: 'Every Daily Pulse post failed today. The signal baseline is not filling.\n\n' +
            'Check: INGEST_URL reachable, INGEST_SECRET matches BLABBING_INGEST_SECRET in Vercel.\n' +
            'Apps Script execution log has the response bodies.',
    });
  }
}

/** Manual smoke test: does not label anything, just reports what it would send. */
function testOnce() {
  var threads = GmailApp.search(SEARCH, 0, 10);
  Logger.log('Search matched %s thread(s)', threads.length);
  threads.forEach(function (t) {
    t.getMessages().forEach(function (m) {
      Logger.log('  %s | %s | %s bytes raw', m.getDate(), m.getSubject(), m.getRawContent().length);
    });
  });
  if (!threads.length) {
    Logger.log('No matches. Widen SEARCH (try newer_than:7d) or confirm the sender address.');
  }
}

/**
 * ONE-OFF REPAIR: wipe the store and re-send every pulse email through a fixed parser.
 *
 * Needed because signals are stored parsed, not raw. When a parser bug is fixed there is
 * nothing to re-derive from — the emails have to come through again. This also strips the
 * ContentOS/Ingested label so the normal search picks them back up.
 *
 * Widens the window to 7 days (the daily run uses 2) so pulses from earlier in the week are
 * still reachable. Run this manually; do not put it on a trigger.
 */
function reingestAll() {
  var url = prop_('INGEST_URL');
  var secret = prop_('INGEST_SECRET');

  // 1. Wipe the store, including the dedup set that would otherwise reject the re-run.
  var wipe = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    headers: { 'X-B4B-Secret': secret },
    payload: JSON.stringify({ reset: 'yes-wipe-blabbing' }),
    muteHttpExceptions: true,
  });
  Logger.log('Reset -> %s %s', wipe.getResponseCode(), wipe.getContentText().slice(0, 200));
  if (wipe.getResponseCode() !== 200) {
    Logger.log('Reset failed. Stopping before re-send so nothing is half-done.');
    return;
  }

  // 2. Un-label so forwardDailyPulses sees them as unprocessed again.
  var label = getOrCreateLabel_();
  var labelled = GmailApp.search('label:"' + LABEL + '"', 0, 100);
  labelled.forEach(function (t) { t.removeLabel(label); });
  Logger.log('Un-labelled %s thread(s)', labelled.length);

  // 3. Re-send with a wider window than the daily run.
  var saved = SEARCH;
  SEARCH = 'from:notifications@appuser.io subject:"Daily Pulse" newer_than:7d';
  try { forwardDailyPulses(); } finally { SEARCH = saved; }
}

/** Read back what the store actually holds — confirms the round trip end to end. */
function verifyStored() {
  var res = UrlFetchApp.fetch(prop_('INGEST_URL') + '?limit=10', { muteHttpExceptions: true });
  Logger.log(res.getContentText().slice(0, 2000));
}
