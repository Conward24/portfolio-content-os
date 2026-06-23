// ─────────────────────────────────────────────────────────────────
// BRAND DESIGN TOKENS
// Single source of truth for the graphics engine. Tweak a value here
// and every template for that brand updates — no pixel surgery.
// ─────────────────────────────────────────────────────────────────

export const BRAND_TOKENS = {
  mylua: {
    font: 'Poppins',
    bg: '#FAF7F2',          // cream
    bgDark: '#2C4D45',      // teal primary
    ink: '#2C4D45',         // primary text on light
    inkSoft: 'rgba(44,77,69,0.55)',
    accent: '#A86D53',      // clay secondary
    accentWarm: '#DFAC7A',  // sand tertiary
    onDark: '#FAF7F2',
    onDarkSoft: 'rgba(250,247,242,0.78)',
    hairline: 'rgba(44,77,69,0.15)',
    logoUrl: 'https://raw.githubusercontent.com/Conward24/flask-chatbot/main/MyLUA%20Logo%2012.23.25.png',
    label: 'MyLÚA Health',
    website: 'myluahealth.com',
  },
  henway: {
    font: 'Raleway',
    bg: '#FFFFFF',
    bgDark: '#000000',
    ink: '#000000',
    inkSoft: 'rgba(0,0,0,0.55)',
    accent: '#FFCC00',      // yellow
    accentWarm: '#FFCC00',
    onDark: '#FFFFFF',
    onDarkSoft: 'rgba(255,255,255,0.75)',
    charcoal: '#3A3A3A',
    hairline: 'rgba(0,0,0,0.12)',
    logoBlackUrl: 'https://raw.githubusercontent.com/Conward24/henway-website/main/public/images/logo-black.png',
    logoWhiteUrl: 'https://raw.githubusercontent.com/Conward24/henway-website/main/White%20-%20Henway%20Logo%20(50%20x%20200%20px)%20(200%20x%2050%20px)%20(2).png',
    label: 'Henway',
    website: 'henwayai.com',
  },
  blabbing: {
    font: 'Inter',
    bg: '#f8f8f8',
    bgDark: '#0a0a12',      // near-black indigo
    ink: '#111111',
    inkSoft: 'rgba(17,17,17,0.55)',
    accent: '#5e17eb',      // indigo
    accentWarm: '#ffbd59',  // gold
    deep: '#381d5c',
    onDark: '#f8f8f8',
    onDarkSoft: 'rgba(248,248,248,0.72)',
    hairline: 'rgba(248,248,248,0.14)',
    logoLightUrl: 'https://raw.githubusercontent.com/Conward24/flask-chatbot/main/Blabbing%20Logo%20-%20Blabbing%20Light%20Background.png',
    logoDarkUrl: 'https://raw.githubusercontent.com/Conward24/flask-chatbot/main/Blabbing%20Dark%20Background.png%20(1).png',
    label: 'Blabbing',
    website: 'blabbing.io',
  },
  mike: {
    font: 'Inter',
    bg: '#F1EFE8',
    bgDark: '#1c1c1a',
    ink: '#2b2b28',
    inkSoft: 'rgba(43,43,40,0.55)',
    accent: '#888780',
    accentWarm: '#A86D53',
    onDark: '#F1EFE8',
    onDarkSoft: 'rgba(241,239,232,0.75)',
    hairline: 'rgba(43,43,40,0.14)',
    photoUrl: 'https://raw.githubusercontent.com/Conward24/henway-website/main/public/images/mike.jpg',
    label: 'Dr. Michael Conward',
    website: 'linkedin.com/in/michaelconward',
  },
};

// Sentiment pill colors (Blabbing intelligence briefs)
export const SENTIMENT_PILL = {
  fr: { label: 'RISING FRUSTRATION', color: '#D85A30' },
  em: { label: 'EMERGING SIGNAL', color: '#5e17eb' },
  po: { label: 'ACCELERATING POSITIVE', color: '#1D9E75' },
  co: { label: 'SHIFTING CONSENSUS', color: '#BA7517' },
};

export function tokensFor(brand) {
  return BRAND_TOKENS[brand] || BRAND_TOKENS.mike;
}
