/* ---------------------------------------------------------------------------
   Icons.jsx — inline SVG icon set (24×24, stroke-based, currentColor).
   No icon dependency: the whole site ships ~6 KB of paths instead of a library.
--------------------------------------------------------------------------- */

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

const make = (paths, extra = {}) =>
  function Icon({ className = 'h-5 w-5', ...rest }) {
    return (
      <svg {...base} {...extra} className={className} aria-hidden="true" {...rest}>
        {paths}
      </svg>
    );
  };

export const Leaf = make(
  <>
    <path d="M12 3c4.5 3.4 7 7 7 10.5A7 7 0 0 1 12 21a7 7 0 0 1-7-7.5C5 10 7.5 6.4 12 3Z" />
    <path d="M12 6v15" />
    <path d="M12 12c-2.2 0-3.8 1.2-4.6 3.2 2.3.4 4-.5 4.6-3.2ZM12 16c2.2 0 3.8 1.2 4.6 3.2-2.3.4-4-.5-4.6-3.2Z" />
  </>,
);

export const Clock = make(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5.2l3.2 2" />
  </>,
);

export const Phone = make(
  <path d="M6.5 3.5h3l1.5 4-2 1.4a12.5 12.5 0 0 0 6.1 6.1l1.4-2 4 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.5 5.7a2 2 0 0 1 2-2.2Z" />,
);

export const MapPin = make(
  <>
    <path d="M12 21s7-5.4 7-11a7 7 0 1 0-14 0c0 5.6 7 11 7 11Z" />
    <circle cx="12" cy="10" r="2.6" />
  </>,
);

export const Instagram = make(
  <>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
  </>,
);

export const Star = make(<path d="m12 3.6 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.8l5.9-.9L12 3.6Z" />, {
  fill: 'currentColor',
  stroke: 'none',
});

export const StarOutline = make(<path d="m12 3.6 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.8l5.9-.9L12 3.6Z" />);

export const ChevronDown = make(<path d="m6 9 6 6 6-6" />);
export const ChevronLeft = make(<path d="m15 5-7 7 7 7" />);
export const ChevronRight = make(<path d="m9 5 7 7-7 7" />);
export const ArrowRight = make(
  <>
    <path d="M4 12h15" />
    <path d="m13 6 6 6-6 6" />
  </>,
);

export const Calendar = make(
  <>
    <rect x="3" y="5" width="18" height="16" rx="2.5" />
    <path d="M3 10h18M8 3v4M16 3v4" />
  </>,
);

export const CalendarCheck = make(
  <>
    <rect x="3" y="5" width="18" height="16" rx="2.5" />
    <path d="M3 10h18M8 3v4M16 3v4M8.5 15.2l2.2 2.2 4.3-4.4" />
  </>,
);

export const Users = make(
  <>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
    <path d="M16 5.5a3.2 3.2 0 0 1 0 6.3M17.5 14.6A5.5 5.5 0 0 1 20.5 20" />
  </>,
);

export const Check = make(<path d="m4.5 12.5 5 5 10-11" />, { strokeWidth: 2 });
export const X = make(<path d="M6 6l12 12M18 6 6 18" />, { strokeWidth: 1.8 });
export const Plus = make(<path d="M12 5v14M5 12h14" />, { strokeWidth: 1.8 });
export const Minus = make(<path d="M5 12h14" />, { strokeWidth: 1.8 });

export const ShoppingBag = make(
  <>
    <path d="M5 8h14l-1.1 11.2a2 2 0 0 1-2 1.8H8.1a2 2 0 0 1-2-1.8L5 8Z" />
    <path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
  </>,
);

export const Sparkles = make(
  <>
    <path d="M12 3.5 13.6 8 18 9.6 13.6 11.2 12 15.7 10.4 11.2 6 9.6 10.4 8 12 3.5Z" />
    <path d="M18.5 15.5l.7 1.9 1.9.7-1.9.7-.7 1.9-.7-1.9-1.9-.7 1.9-.7.7-1.9Z" />
  </>,
);

export const Flame = make(
  <>
    <path d="M12 3s5 4 5 9a5 5 0 0 1-10 0c0-1.6.6-3 1.5-4 .2 1.4 1 2.2 2 2.2 1.4 0 2-1.2 1.7-3-.2-1.6-.2-3-.2-4.2Z" />
    <path d="M9 17.5a3 3 0 0 0 6 0" />
  </>,
);

export const Utensils = make(
  <>
    <path d="M7 3v7a2 2 0 0 0 4 0V3M9 10v11" />
    <path d="M17 3c-1.6 1-2.5 2.6-2.5 4.5S15.4 11 17 11v10" />
  </>,
);

export const Coffee = make(
  <>
    <path d="M4 8h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8Z" />
    <path d="M16 9.5h1.5a2.5 2.5 0 0 1 0 5H16M6 3.5v1.5M10 3v2M14 3.5v1.5" />
  </>,
);

export const Wifi = make(
  <>
    <path d="M4 9.5a12 12 0 0 1 16 0M7 13a8 8 0 0 1 10 0M10 16.4a4 4 0 0 1 4 0" />
    <circle cx="12" cy="19.5" r="1" fill="currentColor" stroke="none" />
  </>,
);

export const Parking = make(
  <>
    <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
    <path d="M10 17V8h2.6a2.9 2.9 0 0 1 0 5.8H10" />
  </>,
);

export const Cake = make(
  <>
    <path d="M4 20h16v-6a3 3 0 0 0-3-3H7a3 3 0 0 0-3 3v6Z" />
    <path d="M4 15.5c1.6 0 1.6 1.4 3.2 1.4s1.6-1.4 3.2-1.4 1.6 1.4 3.2 1.4 1.6-1.4 3.2-1.4 1.6 1.4 3.2 1.4" />
    <path d="M12 8V5.5M9.2 8V6M14.8 8V6" />
  </>,
);

export const Music = make(
  <>
    <circle cx="7" cy="17.5" r="2.5" />
    <circle cx="17.5" cy="15.5" r="2.5" />
    <path d="M9.5 17.5V7l10.5-2v10.5" />
  </>,
);

export const Projector = make(
  <>
    <rect x="2.5" y="7" width="19" height="10" rx="2.5" />
    <circle cx="9" cy="12" r="2.8" />
    <path d="M16 10.5h3M16 13.5h3M6 20h12" />
  </>,
);

export const Quote = make(
  <path
    d="M9.5 6C6.5 7.4 5 9.8 5 13.2V18h5.5v-5.6H8.2c0-2 .8-3.4 2.6-4.3L9.5 6Zm9 0c-3 1.4-4.5 3.8-4.5 7.2V18H19.5v-5.6h-2.3c0-2 .8-3.4 2.6-4.3L18.5 6Z"
    fill="currentColor"
    stroke="none"
  />,
);

export const ExternalLink = make(
  <>
    <path d="M14 4h6v6" />
    <path d="M20 4 11 13" />
    <path d="M18 14v4.5A1.5 1.5 0 0 1 16.5 20h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H10" />
  </>,
);

export const MenuBars = make(<path d="M4 7h16M4 12h16M4 17h16" />, { strokeWidth: 1.8 });

export const Search = make(
  <>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m16 16 4 4" />
  </>,
);

export const Dashboard = make(
  <>
    <rect x="3.5" y="3.5" width="7" height="7" rx="2" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="2" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="2" />
    <rect x="13.5" y="13.5" width="7" height="7" rx="2" />
  </>,
);

export const Receipt = make(
  <>
    <path d="M6 3h12v18l-3-1.8-3 1.8-3-1.8L6 21V3Z" />
    <path d="M9.5 8h5M9.5 12h5" />
  </>,
);

export const BookOpen = make(
  <>
    <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H19v16H6.5A2.5 2.5 0 0 0 4 20.5v-16Z" />
    <path d="M4 18.5A2.5 2.5 0 0 1 6.5 16H19v6H6.5A2.5 2.5 0 0 1 4 19.5" />
  </>,
);

export const Images = make(
  <>
    <rect x="3" y="5.5" width="13.5" height="13.5" rx="2.5" />
    <path d="M7.5 3h11a2.5 2.5 0 0 1 2.5 2.5v11" />
    <circle cx="8" cy="10.5" r="1.6" />
    <path d="m4.5 17 4-4 3.5 3.5 2-2 4 4" />
  </>,
);

export const BarChart = make(
  <>
    <path d="M4 20h16" />
    <rect x="5.5" y="11" width="3.5" height="6" rx="1" />
    <rect x="10.5" y="7" width="3.5" height="10" rx="1" />
    <rect x="15.5" y="13" width="3.5" height="4" rx="1" />
  </>,
);

export const Upload = make(
  <>
    <path d="M12 16V4.5" />
    <path d="m7.5 9 4.5-4.5L16.5 9" />
    <path d="M4.5 15v3a2.5 2.5 0 0 0 2.5 2.5h10a2.5 2.5 0 0 0 2.5-2.5v-3" />
  </>,
);

export const Trash = make(
  <>
    <path d="M4.5 6.5h15M9.5 6.5V4.8A1.3 1.3 0 0 1 10.8 3.5h2.4a1.3 1.3 0 0 1 1.3 1.3v1.7" />
    <path d="M6.5 6.5 7.4 20a1.5 1.5 0 0 0 1.5 1.4h6.2a1.5 1.5 0 0 0 1.5-1.4l.9-13.5" />
    <path d="M10.5 10.5v6.5M13.5 10.5v6.5" />
  </>,
);

export const Pencil = make(
  <>
    <path d="M4 20h4L20 8l-4-4L4 16v4Z" />
    <path d="m14.5 5.5 4 4" />
  </>,
);

export const LogOut = make(
  <>
    <path d="M15 4.5h3A2.5 2.5 0 0 1 20.5 7v10a2.5 2.5 0 0 1-2.5 2.5h-3" />
    <path d="M11 8 7 12l4 4M7 12h9" />
  </>,
);

export const Lock = make(
  <>
    <rect x="4.5" y="10" width="15" height="10.5" rx="2.5" />
    <path d="M8 10V7.5a4 4 0 0 1 8 0V10" />
    <circle cx="12" cy="15" r="1.3" fill="currentColor" stroke="none" />
  </>,
);

export const Alert = make(
  <>
    <path d="M12 4.5 21 19.5H3L12 4.5Z" />
    <path d="M12 10v4" />
    <circle cx="12" cy="16.8" r="1" fill="currentColor" stroke="none" />
  </>,
);

export const CheckCircle = make(
  <>
    <circle cx="12" cy="12" r="8.5" />
    <path d="m8.2 12.3 2.6 2.6 5-5.4" />
  </>,
);

export const XCircle = make(
  <>
    <circle cx="12" cy="12" r="8.5" />
    <path d="m9.2 9.2 5.6 5.6M14.8 9.2l-5.6 5.6" />
  </>,
);

export const ClockCircle = make(
  <>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l2.8 1.7" />
  </>,
);

export const Drag = make(
  <>
    <circle cx="9" cy="6" r="1.3" fill="currentColor" stroke="none" />
    <circle cx="15" cy="6" r="1.3" fill="currentColor" stroke="none" />
    <circle cx="9" cy="12" r="1.3" fill="currentColor" stroke="none" />
    <circle cx="15" cy="12" r="1.3" fill="currentColor" stroke="none" />
    <circle cx="9" cy="18" r="1.3" fill="currentColor" stroke="none" />
    <circle cx="15" cy="18" r="1.3" fill="currentColor" stroke="none" />
  </>,
);

export const Refresh = make(
  <>
    <path d="M20 12a8 8 0 1 1-2.6-5.9" />
    <path d="M20 4v4.5h-4.5" />
  </>,
);

export const Eye = make(
  <>
    <path d="M2.5 12S6 6.5 12 6.5 21.5 12 21.5 12 18 17.5 12 17.5 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="2.8" />
  </>,
);

export const Download = make(
  <>
    <path d="M12 4v11" />
    <path d="m7.5 10.5 4.5 4.5 4.5-4.5" />
    <path d="M4.5 17v1.5A2.5 2.5 0 0 0 7 21h10a2.5 2.5 0 0 0 2.5-2.5V17" />
  </>,
);

export const Chef = make(
  <>
    <path d="M7 20h10v-6H7v6Z" />
    <path d="M7 14a4.5 4.5 0 0 1-1.6-8.7 4 4 0 0 1 7.4-2.1 4 4 0 0 1 6.6 3.5A4.4 4.4 0 0 1 17 14" />
  </>,
);

export const VegDot = ({ className = 'h-4 w-4', veg = true }) => (
  <span
    className={`veg-mark ${veg ? 'border-forest-600' : 'border-clay-600'}`}
    title={veg ? 'Vegetarian' : 'Non-vegetarian'}
    aria-label={veg ? 'Vegetarian' : 'Non-vegetarian'}
    role="img"
  >
    <span className={`h-2 w-2 rounded-full ${veg ? 'bg-forest-600' : 'bg-clay-600'}`} />
  </span>
);
