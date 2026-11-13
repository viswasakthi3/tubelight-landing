export type Question = {
  q: string;
  multi?: boolean;
  opts: string[];
  /** adds an "Other" chip last; picking it opens an inline text box */
  other?: true;
  /** optional extra input under the chips, saved as "About: …" */
  about?: { label: string; placeholder: string };
};

export const OTHER = "Other";

export const QS: Question[] = [
  { q: "Which best describes you?", opts: ["School student", "College student", "Working professional", "Teacher or researcher", "Just curious"], other: true },
  {
    q: "Think of the last time you got stuck on something you were reading. Where were you reading it?",
    opts: ["A PDF or e-book", "A website or article", "Word or Google Docs", "Notion or OneNote", "Slack, Teams or email"],
    other: true,
    about: { label: "What was it about?", placeholder: "e.g. the Krebs cycle in my biology notes" },
  },
  { q: "What did you do to understand it?", multi: true, opts: ["Googled it", "Asked ChatGPT or another AI", "Watched a YouTube video", "Asked a friend or teacher", "Gave up and moved on"], other: true },
  { q: "In the last 7 days, how many times did that happen?", opts: ["Not once", "Once or twice", "3 to 5 times", "Almost every day"] },
  { q: "What do you pay for today to learn or understand things?", multi: true, opts: ["Nothing, free tools only", "ChatGPT Plus or another AI plan", "Coaching or tuition", "Online courses or apps", "Books or test series"], other: true },
  { q: "How did you hear about Tubelight?", opts: ["A friend", "YouTube", "Instagram", "LinkedIn", "Google search"], other: true },
];
