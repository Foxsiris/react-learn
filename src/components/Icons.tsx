import type { CSSProperties, SVGProps } from "react";

type IconProps = {
  size?: number;
  className?: string;
  style?: CSSProperties;
} & Omit<SVGProps<SVGSVGElement>, "ref">;

type SVGFC = (p: IconProps) => React.ReactElement;

function makeIcon(
  body: React.ReactNode,
  options?: { fillCurrent?: boolean }
): SVGFC {
  const { fillCurrent } = options ?? {};
  return ({ size = 18, className, style, ...rest }: IconProps) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fillCurrent ? "currentColor" : "none"}
      stroke={fillCurrent ? "none" : "currentColor"}
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      {...rest}
    >
      {body}
    </svg>
  );
}

export const I = {
  home:   makeIcon(<><path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/></>),
  map:    makeIcon(<><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z"/><path d="M9 4v14M15 6v14"/></>),
  book:   makeIcon(<><path d="M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2V5Z"/><path d="M4 19a2 2 0 0 0 2 2h12"/><path d="M8 7h7M8 11h7"/></>),
  code:   makeIcon(<><path d="m9 8-5 4 5 4"/><path d="m15 8 5 4-5 4"/><path d="m13 6-2 12"/></>),
  user:   makeIcon(<><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></>),
  trophy: makeIcon(<><path d="M7 4h10v4a5 5 0 0 1-10 0V4Z"/><path d="M7 6H4a2 2 0 0 0 2 4M17 6h3a2 2 0 0 1-2 4"/><path d="M12 13v4M8 21h8M9 17h6"/></>),
  bolt:   makeIcon(<><path d="M13 3 5 14h6l-1 7 8-11h-6l1-7Z"/></>),
  flame:  makeIcon(<><path d="M12 22c4 0 7-3 7-7 0-3-2-4-3-7-1 2-2 3-4 3 0-3-1-5-3-8-1 4-4 6-4 11 0 4 3 8 7 8Z"/></>),
  heart:  makeIcon(<><path d="M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6C19 16.5 12 21 12 21Z"/></>, { fillCurrent: true }),
  heartO: makeIcon(<><path d="M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6C19 16.5 12 21 12 21Z"/></>),
  check:  makeIcon(<><path d="m5 12 5 5L20 7"/></>),
  lock:   makeIcon(<><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 1 1 8 0v3"/></>),
  play:   makeIcon(<><path d="M7 4v16l13-8L7 4Z"/></>, { fillCurrent: true }),
  search: makeIcon(<><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></>),
  bell:   makeIcon(<><path d="M6 17V11a6 6 0 0 1 12 0v6"/><path d="M4 17h16M10 21h4"/></>),
  star:   makeIcon(<><path d="m12 3 2.6 6 6.4.5-4.9 4.3 1.5 6.3L12 17l-5.6 3.1L7.9 13.8 3 9.5 9.4 9 12 3Z"/></>, { fillCurrent: true }),
  arrow:  makeIcon(<><path d="M5 12h14m-5-5 5 5-5 5"/></>),
  arrowL: makeIcon(<><path d="M19 12H5m5-5-5 5 5 5"/></>),
  chevR:  makeIcon(<><path d="m9 6 6 6-6 6"/></>),
  chevD:  makeIcon(<><path d="m6 9 6 6 6-6"/></>),
  plus:   makeIcon(<><path d="M12 5v14M5 12h14"/></>),
  close:  makeIcon(<><path d="M6 6l12 12M18 6L6 18"/></>),
  refresh:makeIcon(<><path d="M20 12a8 8 0 1 1-2.5-5.8"/><path d="M20 4v4h-4"/></>),
  terminal: makeIcon(<><rect x="3" y="4" width="18" height="16" rx="2"/><path d="m7 9 3 3-3 3M13 15h4"/></>),
  eye:    makeIcon(<><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></>),
  target: makeIcon(<><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/></>),
  clock:  makeIcon(<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>),
  gift:   makeIcon(<><rect x="3" y="9" width="18" height="11" rx="1.5"/><path d="M3 13h18M12 9v11M9 9a3 3 0 1 1 3-3M15 9a3 3 0 1 0-3-3"/></>),
  spark:  makeIcon(<><path d="M12 3v4M12 17v4M5 12H1M23 12h-4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/></>),
  list:   makeIcon(<><path d="M8 6h13M8 12h13M8 18h13M4 6h.01M4 12h.01M4 18h.01"/></>),
  settings: makeIcon(<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/></>),
  fire:   makeIcon(<><path d="M12 22c4 0 7-3 7-7 0-3-2-4-3-7-1 2-2 3-4 3 0-3-1-5-3-8-1 4-4 6-4 11 0 4 3 8 7 8Z"/></>, { fillCurrent: true }),
} satisfies Record<string, SVGFC>;

export type IconKey = keyof typeof I;
