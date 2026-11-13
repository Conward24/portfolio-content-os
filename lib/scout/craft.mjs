// The craft spec: everything an editor would copy from a post that travelled,
// measured closely enough to replicate (captions, fonts, graphics, camera,
// actions, edit, sound, post caption, hashtags). Used by the breakdown of new
// cards (scripts/scout/analyze.mjs), the re-run on old cards
// (scripts/scout/reanalyze.mjs) and the check of our own cuts against the
// formats (scripts/scout/compare.mjs), so all three speak the same fields.

export const CRAFT_SHAPE = `{
  "lengthSec": 0,
  "captions": {
    "present": true,
    "source": "burned-in by the creator | platform auto-captions | none",
    "font": "closest real font family + weight you can see, e.g. 'Montserrat ExtraBold', 'TikTok Sans Bold', 'Proxima Nova Black', 'Instagram Classic'. Say how sure you are.",
    "case": "UPPER | Sentence | lower | Mixed",
    "color": "text color, highlight color, as hex guesses",
    "treatment": "outline / drop shadow / box behind text / none, with thickness",
    "sizeVsWidth": "roughly what share of the frame width one line fills",
    "position": "vertical position as % from the top, and where it sits relative to the face/screen",
    "wordsPerScreen": 0,
    "animation": "word-by-word pop, karaoke highlight, line-by-line, static, typewriter...",
    "emphasis": "how key words are marked (color swap, bigger, emoji, underline) or none"
  },
  "headline": { "text": "persistent title/banner/hook text, verbatim, or null", "font": "", "position": "", "onScreenFor": "whole video | first N seconds" },
  "graphics": ["every overlay that is not a caption, with when it appears: emoji, arrows, circles, stickers, screenshots, logos, number counters, progress bar, zoom punch-ins, green screen"],
  "camera": {
    "framing": "extreme close-up | close-up | medium | wide; where the eyes sit in the frame",
    "angle": "eye level | slightly above | below",
    "movement": "locked | handheld | walking | car mount",
    "location": "where it is shot",
    "lighting": "window / ring light / outdoor / dim; how bright the face is",
    "wardrobeProps": "what they wear or hold that matters"
  },
  "performer": {
    "firstFrame": "what the person is doing at 0.0s (mid-sentence? looking at lens? holding the phone up?)",
    "energy": "calm | conversational | high",
    "eyeLine": "into the lens | at a screen | off camera",
    "gestures": ["specific gestures/actions and when, e.g. 'points up at the screen at 2s'"],
    "wordsPerSec": 0
  },
  "editing": {
    "layout": "full face | split (screen top N% / face bottom) | picture-in-picture | screen only | green screen",
    "cutsPerSec": 0,
    "jumpCuts": "yes/no, and whether pauses are cut out",
    "punchIns": "zoom-ins on the face or screen, how often",
    "transitions": "hard cut | whip | none",
    "screenTime": "share of the video showing a screen/app/B-roll vs the face",
    "loop": "does the last second lead back into the first"
  },
  "color": "grade/look: natural, warm, high contrast, desaturated...",
  "audio": { "voice": "on-camera talk | voiceover | none", "music": "track name if shown, or bed type", "musicLevel": "none | low under voice | forward", "sfx": "whooshes, pops, dings or none" },
  "postCaption": {
    "firstLine": "verbatim first line of the post caption",
    "lengthChars": 0,
    "structure": "one line | hook + steps | story | question",
    "cta": "comment X / follow / save / link in bio / none",
    "hashtags": ["#verbatim"],
    "searchPhrase": "the plain phrase a stranger would type to find this"
  },
  "cover": "what the cover/first frame shows and the text on it",
  "replicate": ["6-10 concrete, checkable instructions an editor applies to OUR cut to match this, most important first, e.g. 'Captions: white Montserrat ExtraBold, 2-3 words a screen, centered at 62% from top, black 6px outline'"]
}`;

export const CRAFT_ASK = `Measure the craft as closely as the frames, transcript and caption allow. Read fonts, colors and positions off the frames; count words per caption screen; name gestures and when they happen. Where you can't tell, say "can't tell" instead of guessing. This is what an editor copies to match the post, so be specific enough to execute.`;
