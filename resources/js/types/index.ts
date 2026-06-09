import { LucideIcon } from 'lucide-react';

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    url: string;
    icon?: LucideIcon | null;
    isActive?: boolean;
}

export interface HijriParts {
    year: number;
    month: number;
    day: number;
}

export interface HijriCalendarDefaults {
    current_hijri_year: number;
    default_range: {
        from: string;
        to: string;
        from_hijri?: HijriParts;
        to_hijri?: HijriParts;
    };
}

export interface GregorianCalendarDefaults {
    current_gregorian_year: number;
    default_range: {
        from: string;
        to: string;
    };
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    hijriCalendarDefaults: HijriCalendarDefaults | null;
    gregorianCalendarDefaults: GregorianCalendarDefaults | null;
    [key: string]: unknown;
}

export interface User {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'viewer';
    avatar?: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
}
