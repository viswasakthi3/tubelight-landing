type P = { size?: number };
const base = (size: number) => ({
  width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor",
  strokeWidth: 2.2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true,
});

export const Check = ({ size = 16 }: P) => (<svg {...base(size)} strokeWidth={2.8}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>);
export const Bag = ({ size = 24 }: P) => (<svg {...base(size)}><path d="M5 8h14l-1 12H6L5 8z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></svg>);
export const Send = ({ size = 22 }: P) => (<svg {...base(size)}><path d="M4 12l16-8-6 16-3-7-7-1z" /></svg>);
export const Play = ({ size = 18 }: P) => (<svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" fill="currentColor" /></svg>);
export const Search = ({ size = 14 }: P) => (<svg {...base(size)} strokeWidth={2.4}><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" /></svg>);
export const Back = ({ size = 16 }: P) => (<svg {...base(size)}><path d="M15 5l-7 7 7 7" /></svg>);
export const Fwd = ({ size = 16 }: P) => (<svg {...base(size)}><path d="M9 5l7 7-7 7" /></svg>);
export const Reload = ({ size = 16 }: P) => (<svg {...base(size)}><path d="M20 11a8 8 0 1 0-2.3 5.7" /><path d="M20 4v7h-7" /></svg>);
export const Shield = ({ size = 14 }: P) => (<svg {...base(size)} strokeWidth={2.6}><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" /><path d="M9 12l2 2 4-4" /></svg>);
export const Bolt = ({ size = 20 }: P) => (<svg {...base(size)}><path d="M13 3L5 13h6l-1 8 8-10h-6l1-8z" /></svg>);
export const Link = ({ size = 20 }: P) => (<svg {...base(size)}><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></svg>);
export const Speaker = ({ size = 20 }: P) => (<svg {...base(size)}><path d="M5 9h3l5-4v14l-5-4H5z" /><path d="M16.5 8.5a5 5 0 0 1 0 7" /><path d="M19 6a8.5 8.5 0 0 1 0 12" /></svg>);
export const Chat = ({ size = 20 }: P) => (<svg {...base(size)}><path d="M5 5h14v10H10l-5 4V5z" /></svg>);
export const User = ({ size = 20 }: P) => (<svg {...base(size)}><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></svg>);
export const Pc = ({ size = 20 }: P) => (<svg {...base(size)}><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M8 20h8M12 16v4" /></svg>);
export const Moon = ({ size = 20 }: P) => (<svg {...base(size)}><path d="M20 14.5A8 8 0 1 1 9.5 4 6.5 6.5 0 0 0 20 14.5z" /></svg>);
export const Info = ({ size = 18 }: P) => (<svg {...base(size)}><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></svg>);
export const Mic = ({ size = 14 }: P) => (<svg {...base(size)}><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></svg>);

/** Quick Search mark, drawn the way the app icon is: lens, spark, handle. */
export const Mark = ({ size = 36, className }: P & { className?: string }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 1024 1024" aria-hidden="true">
    <defs>
      <linearGradient id="qs-mark-g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#8f72ff" /><stop offset="1" stopColor="#4527d4" />
      </linearGradient>
    </defs>
    <rect width="1024" height="1024" rx="232" fill="url(#qs-mark-g)" />
    <circle cx="452" cy="452" r="190" fill="#ffe9a3" opacity=".3" />
    <circle cx="452" cy="452" r="214" fill="none" stroke="#ffffff" strokeWidth="68" />
    <path d="M452 322C468 404 500 436 582 452C500 468 468 500 452 582C436 500 404 468 322 452C404 436 436 404 452 322Z" fill="#fff3c4" />
    <path d="M618 618L792 792" stroke="#ffffff" strokeWidth="92" strokeLinecap="round" />
  </svg>
);

/** The Windows mark (four panes), for the Microsoft Store download button. */
export const Windows = ({ size = 22 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
    <rect x="2" y="2" width="9.5" height="9.5" rx="1" /><rect x="12.5" y="2" width="9.5" height="9.5" rx="1" />
    <rect x="2" y="12.5" width="9.5" height="9.5" rx="1" /><rect x="12.5" y="12.5" width="9.5" height="9.5" rx="1" />
  </svg>
);
export const Copy = ({ size = 16 }: P) => (<svg {...base(size)}><rect x="9" y="9" width="11" height="11" rx="2.5" /><path d="M15 9V6.5A2.5 2.5 0 0 0 12.5 4h-6A2.5 2.5 0 0 0 4 6.5v6A2.5 2.5 0 0 0 6.5 15H9" /></svg>);
export const Plus = ({ size = 16 }: P) => (<svg {...base(size)} strokeWidth={2.4}><path d="M12 5v14M5 12h14" /></svg>);
