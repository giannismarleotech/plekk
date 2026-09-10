/** Eenvoudige lijn-iconen voor de navigatie. Geen emoji: die zien er op elk toestel anders uit. */
export type IconName = "home" | "calendar" | "kitchen" | "list" | "people" | "chart" | "settings" | "rocket" | "menu";

const paths: Record<IconName, React.ReactNode> = {
  home: <><path d="M3 10.5 12 3l9 7.5" /><path d="M5.5 9.5V20h13V9.5" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>,
  kitchen: <><path d="M3 12h18" /><path d="M5 12a7 7 0 0 1 14 0" /><path d="M4 16h16" /><path d="M7 20h10" /></>,
  list: <><path d="M8 6h13M8 12h13M8 18h13" /><circle cx="3.5" cy="6" r="1.2" /><circle cx="3.5" cy="12" r="1.2" /><circle cx="3.5" cy="18" r="1.2" /></>,
  people: <><circle cx="9" cy="8" r="3.2" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M16 5.5a3 3 0 0 1 0 5.6" /><path d="M17 14.5a5.5 5.5 0 0 1 4.5 5.5" /></>,
  chart: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></>,
  settings: <><circle cx="12" cy="12" r="3.2" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.2 2.2M16.9 16.9l2.2 2.2M19.1 4.9l-2.2 2.2M7.1 16.9l-2.2 2.2" /></>,
  rocket: <><path d="M12 3c3.5 2 5.5 5.5 5.5 9.5L12 17l-5.5-4.5C6.5 8.5 8.5 5 12 3Z" /><path d="M9 17l-2 4 4-2M15 17l2 4-4-2" /><circle cx="12" cy="10" r="1.6" /></>,
  menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
};

export function NavIcon({ name, size = 22 }: { name: IconName; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden focusable="false">
      {paths[name]}
    </svg>
  );
}
