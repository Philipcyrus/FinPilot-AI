import {
  LayoutDashboard,
  PieChart,
  Wallet,
  PiggyBank,
  Target,
  Lightbulb,
  Search,
  Layers,
  Repeat,
  FlaskConical,
  Newspaper,
  MessageSquare,
  Upload,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon; group: string };

export const NAV: NavItem[] = [
  { href: "/", label: "Overview", icon: LayoutDashboard, group: "Intelligence" },
  { href: "/portfolio", label: "Portfolio", icon: PieChart, group: "Intelligence" },
  { href: "/spending", label: "Spending", icon: Wallet, group: "Intelligence" },
  { href: "/savings", label: "Savings", icon: PiggyBank, group: "Intelligence" },
  { href: "/goals", label: "Goals", icon: Target, group: "Intelligence" },
  { href: "/recommendations", label: "Recommendations", icon: Lightbulb, group: "Intelligence" },

  { href: "/research", label: "Research", icon: Search, group: "Research" },
  { href: "/funds", label: "Funds", icon: Layers, group: "Research" },
  { href: "/sip", label: "SIP Intelligence", icon: Repeat, group: "Research" },
  { href: "/scenarios", label: "Scenarios", icon: FlaskConical, group: "Research" },
  { href: "/news", label: "News", icon: Newspaper, group: "Research" },
  { href: "/chat", label: "AI Co-pilot", icon: MessageSquare, group: "Research" },

  { href: "/import", label: "Import Data", icon: Upload, group: "Account" },
  { href: "/settings", label: "Settings", icon: Settings, group: "Account" },
];

export const NAV_GROUPS = ["Intelligence", "Research", "Account"] as const;
