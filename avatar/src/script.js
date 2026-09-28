// ─────────────────────────────────────────────────────────────────────────────
//  What the avatar says. Edit the text below: nothing else needs to change.
//
//  • Each segment becomes a topic button on the page; the first one is the
//    intro that plays when a visitor presses "Hear from Ajit".
//  • `audio` (optional): a recording of your own voice for that segment, e.g.
//    'assets/voice/intro.mp3'. The lips then follow the real audio and the
//    `text` is used for the captions. Without it the browser's voice is used.
// ─────────────────────────────────────────────────────────────────────────────

export const PROFILE = {
  name: 'Ajit',
  site: 'ajit.business',
  url: 'https://ajit.business',
  headline: "Hi, I'm Ajit.",
  lede: 'Welcome to my corner of the internet. Press play and my 3D twin will walk you through ajit.business.',
};

export const SEGMENTS = [
  {
    id: 'intro',
    label: 'Meet Ajit',
    text: "Hi, I'm Ajit, and welcome to ajit.business, my personal home on the web. "
      + 'I built this space to share who I am, the work I do, and the ideas I care about. '
      + "Take a look around, and if something resonates, I'd love to hear from you.",
  },
  {
    id: 'about',
    label: 'About me',
    text: "A little about me. I'm the person behind this site, and yes, the one talking to you right now, "
      + 'rebuilt in 3D from a single photograph. '
      + "On ajit.business you'll find my background, what I'm focused on today, and the projects that keep me busy.",
  },
  {
    id: 'work',
    label: 'What I do',
    text: 'This is where ajit.business goes deeper: the work I take on, the problems I like solving, '
      + 'and the results I care about. Explore the sections of the site for the details.',
  },
  {
    id: 'contact',
    label: 'Work with me',
    text: 'Want to work together, or just say hello? '
      + "Reach out through the contact details on ajit.business. I'd be glad to hear from you.",
  },
];

// How the browser voice should say words it tends to get wrong.
export const PRONOUNCE = {
  'ajit.business': 'Ajeet dot business',
  Ajit: 'Ajeet',
  "Ajit's": "Ajeet's",
};

// Preferred system voices, best first (matched against "name language").
// Visitors can still pick another voice from the page's voice menu.
export const VOICE = {
  preferences: ['Prabhat', 'Rishi', 'Ravi', 'Hemant', 'Google UK English Male', 'Ryan', 'Andrew', 'Guy',
    'Daniel', 'Aaron', 'Alex', 'David', 'Mark'],
  rate: 1.0,
  pitch: 0.95,
};
