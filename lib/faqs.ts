export interface FaqItem {
  q: string;
  a: string;
}

export const FAQS: FaqItem[] = [
  { q: "What is Tubelight?", a: "Tubelight is an AI visual explainer for Windows 10 and 11. Select text, press Alt + E, and you get a short explanation — pictures, a voice and captions — right beside what you’re reading." },
  { q: "When will I get access?", a: "We invite people in batches, in waitlist order. Answering the optional questions or inviting a friend who joins increases your invite priority." },
  { q: "Can I try it before I’m invited?", a: "Yes. Type a topic in the search box under “Curious about anything?” and Tubelight makes a free preview video right on this page — one a day. You’ll need your email to watch it, which also puts you on the waitlist." },
  { q: "What happens after I join?", a: "You see your place in line and get a personal invite link to share. When your invite is ready, we email you a download link. No newsletters, and you can ask us to remove your email at any time." },
  { q: "Why not just ask ChatGPT?", a: "You can — but that means switching tabs, typing a question and reading a wall of text. Tubelight shows and tells you, in seconds, without leaving your page." },
  { q: "Does it cost anything?", a: "It’s free to try, with no card needed. Paid plans are there for people who learn a lot every day." },
  { q: "Is it accurate?", a: "It’s very good on school, college and everyday topics. But like any AI it can slip now and then. If something looks off, ask a follow-up — and for anything high-stakes, check your textbook or teacher." },
  { q: "Which computers does it work on?", a: "Windows 10 and 11. A Mac version is on the way — join the waitlist and we’ll tell you when it’s ready." },
  { q: "What happens to the text I select?", a: "It’s sent to our servers to make your explanation. We keep a record of the explanations we make so we can fix problems and improve them. Your saved explanations also live on your own PC." },
];
