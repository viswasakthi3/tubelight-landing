export type Question = { q: string; multi?: boolean; text?: boolean; opts?: string[] };

export const QS: Question[] = [
  { q: "Which best describes you?", multi: false, opts: ["Student", "Working professional", "Teacher", "Researcher", "Just curious"] },
  { q: "What would you use it for?", multi: true, opts: ["School & board exams", "JEE or NEET", "College subjects", "Research papers", "Coding", "Work documents", "News & everyday reading"] },
  { q: "Where do you read most?", multi: true, opts: ["PDFs", "Websites", "Word or Google Docs", "Notion", "Slack or Teams", "Somewhere else"] },
  { q: "How often do you get stuck on something you’re reading?", multi: false, opts: ["Every day", "A few times a week", "Now and then"] },
  { q: "What’s one thing you wish someone would explain to you?", text: true },
];
