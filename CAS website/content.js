/* ==========================================================================
   CAS PORTFOLIO: YOUR CONTENT
   --------------------------------------------------------------------------
   This is the ONLY file you need to edit to update the website.
   Every page (home, reflections, each reflection) is built from it.

   HOW TO EDIT (on GitHub): open this file → click the pencil icon → edit →
   "Commit changes". The live site updates in about a minute.

   RULES THAT KEEP THE SITE FROM BREAKING
   • Text goes inside "double quotes". Need a quote mark inside your text?
     Use curly quotes “like this” or write \" instead.
   • Every item in a list [ ... ] or group { ... } ends with a comma.
   • Text starting with ✎ is a PLACEHOLDER. It appears on the site with an
     amber dashed underline so you can spot what still needs writing.
     Delete the ✎ when you replace the text with your own.
   • Formatting inside any text:  *italic*   **bold**   [link text](https://…)
   • Images: upload them into  CAS website/assets/img/  (GitHub → "Add file"
     → "Upload files"), then write the path, e.g. "assets/img/beach-cleanup.jpg"
   • Files (like your CAS Personal Profile PDF) go in  CAS website/assets/files/
   ========================================================================== */

window.CAS = {

  /* ------------------------------------------------------------------------
     YOU
     ------------------------------------------------------------------------ */
  student: {
    firstName: "Your",
    lastName: "Name",
    school: "✎ Your School",
    classOf: "2027",
    programme: "IB Diploma Programme",
    tagline: "✎ One sentence that captures you: what you're chasing, building or learning over these two years.",

    // A photo of you. Leave "" to show an animated monogram instead.
    photo: "",                 // e.g. "assets/img/me.jpg"

    // Your CAS Personal Profile from the start of the year (PDF or image).
    // Leave "" until you upload it; a reminder button shows until then.
    profileFile: "",           // e.g. "assets/files/cas-personal-profile.pdf"
  },

  /* ------------------------------------------------------------------------
     HOMEPAGE: WHO ARE YOU?
     ------------------------------------------------------------------------ */
  about: {
    headline: "✎ A short, bold statement about who you are. Use *italics* for one key word.",
    paragraphs: [
      "✎ Introduce yourself in 2–3 sentences: where you're from, what you care about, what you spend your time doing.",
      "✎ A second paragraph on what drives you, or how you hope to change over the next two years.",
    ],
    // Quick facts shown beside your intro. Add, remove or rename freely.
    facts: [
      { label: "Based in",      value: "✎ City, Country" },
      { label: "Languages",     value: "✎ e.g. English, Spanish" },
      { label: "HL subjects",   value: "✎ Your three HL subjects" },
    ],
  },

  /* Your interests: shown on a 3D ring you can drag and spin. 4–8 works best. */
  interests: [
    { title: "✎ Interest one",   text: "✎ One line on why it matters to you." },
    { title: "✎ Interest two",   text: "✎ One line on why it matters to you." },
    { title: "✎ Interest three", text: "✎ One line on why it matters to you." },
    { title: "✎ Interest four",  text: "✎ One line on why it matters to you." },
    { title: "✎ Interest five",  text: "✎ One line on why it matters to you." },
    { title: "✎ Interest six",   text: "✎ One line on why it matters to you." },
  ],

  /* Your strengths. 3–6 works best. */
  strengths: [
    { title: "✎ Strength one",   text: "✎ A specific example of when you showed this." },
    { title: "✎ Strength two",   text: "✎ A specific example of when you showed this." },
    { title: "✎ Strength three", text: "✎ A specific example of when you showed this." },
    { title: "✎ Strength four",  text: "✎ A specific example of when you showed this." },
  ],

  /* What CAS means to you. Lights up word by word as visitors scroll. 2–4 sentences. */
  casMeaning: "✎ Write 2–4 sentences about what CAS means to you. Not the textbook definition, but what it means for your life: what you want to try, who you want to become, and why it matters.",

  /* What each strand means to YOU. Shown beside the 3D letters C, A and S. */
  strands: {
    C: {
      meaning: "✎ What creativity looks like in your life, and what you want to explore.",
      examples: ["✎ e.g. Photography", "✎ e.g. School musical"],
    },
    A: {
      meaning: "✎ How you move, train or stay active, and what you want to push further.",
      examples: ["✎ e.g. Varsity soccer", "✎ e.g. Morning runs"],
    },
    S: {
      meaning: "✎ The community need you care about, and how you want to help.",
      examples: ["✎ e.g. Tutoring younger students", "✎ e.g. Beach clean-ups"],
    },
  },

  /* Your goals for CAS. strand: "C", "A", "S" (or "" for none). */
  goals: [
    { title: "✎ Goal one",   text: "✎ What exactly you want to achieve, and how you'll know you did.", strand: "C" },
    { title: "✎ Goal two",   text: "✎ What exactly you want to achieve, and how you'll know you did.", strand: "A" },
    { title: "✎ Goal three", text: "✎ What exactly you want to achieve, and how you'll know you did.", strand: "S" },
  ],

  /* What you hope to improve or challenge yourself in. */
  challenges: [
    { title: "✎ Challenge one",   text: "✎ Something outside your comfort zone and why you want to face it." },
    { title: "✎ Challenge two",   text: "✎ A skill you want to grow, and where you're starting from." },
    { title: "✎ Challenge three", text: "✎ A habit or mindset you want to change." },
  ],

  /* ------------------------------------------------------------------------
     THE JOURNEY: progress tracker on the homepage
     ------------------------------------------------------------------------ */
  journey: {
    reflectionsRequired: 7,
    project: {
      title: "CAS Project",
      when: "Coming senior year",
      text: "A collaborative, month-long project that brings the strands together.",
    },
    final: {
      title: "Final CAS reflection",
      when: "March 2027",
      date: "2027-03-01",     // the countdown counts to this date (YYYY-MM-DD)
      text: "Looking back on the whole journey: what changed, and what's next.",
    },
  },

  /* ------------------------------------------------------------------------
     QUARTERLY DEEP REFLECTIONS (minimum of 7)
     ------------------------------------------------------------------------
     Once a quarter, copy the whole { ... } block below (from the opening {
     to the closing }, including the comma), paste it underneath, and fill it in.
     Each section matches a required part of the assignment.

     • id: a short unique name with no spaces. It becomes the page link.
     • strands: one or more of "C", "A", "S"
     • outcomes: which learning outcomes (1–7) you developed, and HOW.
       The full list of learning outcomes is at the bottom of this file.
     • Each section is a list of paragraphs: ["First paragraph.", "Second."]
     • evidence types:
         { type: "image", src: "assets/img/file.jpg", caption: "…" }
         { type: "video", src: "https://youtu.be/…", caption: "…" }   ← YouTube link or .mp4 file
         { type: "link",  url: "https://…", label: "…" }
     ------------------------------------------------------------------------ */
  reflections: [
    {
      id: "reflection-1",
      quarter: "✎ Q1 · 2025–26",
      date: "✎ Sept – Nov 2025",
      title: "✎ Name of the experience",
      strands: ["C"],
      cover: "",               // e.g. "assets/img/r1-cover.jpg"
      role: "✎ Your role, e.g. Organiser / Team member",
      summary: "✎ One or two sentences previewing this experience. This shows on the card.",

      outcomes: [
        { lo: 1, how: "✎ How this experience showed learning outcome 1. Be specific." },
        { lo: 2, how: "✎ How this experience showed learning outcome 2. Be specific." },
      ],

      experience:    ["✎ What was the experience? Where, when, who with, and why you chose it."],
      challenges:    ["✎ Explain the challenges you faced. What made this hard for you personally?"],
      obstacles:     ["✎ Show how you handled the obstacles. What did you try, what failed, what worked?"],
      skills:        ["✎ Describe the skills you developed, and how you know you improved."],
      collaboration: ["✎ Reflect on collaboration. Who did you work with, and what did you learn from them?"],
      impact:        ["✎ Consider impact and responsibility. Who was affected, and what was your responsibility to them?"],
      examples:      ["✎ Include a specific example: one moment, conversation or decision, told in detail."],

      // Optional one-line takeaway shown as a big pull quote. Delete the line to hide it.
      quote: "✎ One sentence that sums up what you learned.",

      evidence: [
        { type: "image", src: "", caption: "✎ Photo of you during the activity" },
        { type: "image", src: "", caption: "✎ Photo of the result, product or event" },
        { type: "image", src: "", caption: "✎ A screenshot, poster, certificate or plan" },
        { type: "link",  url: "", label: "✎ Link to a video, document or post (optional)" },
      ],
    },

    // ↓ Paste your next reflection here.
  ],

  /* ------------------------------------------------------------------------
     IB CAS LEARNING OUTCOMES (you probably don't need to edit these)
     ------------------------------------------------------------------------ */
  learningOutcomes: {
    1: "Identify own strengths and develop areas for growth",
    2: "Demonstrate that challenges have been undertaken, developing new skills in the process",
    3: "Demonstrate how to initiate and plan a CAS experience",
    4: "Show commitment to and perseverance in CAS experiences",
    5: "Demonstrate the skills and recognize the benefits of working collaboratively",
    6: "Demonstrate engagement with issues of global significance",
    7: "Recognize and consider the ethics of choices and actions",
  },
};
