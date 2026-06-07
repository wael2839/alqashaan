import AppLogoIcon from '@/components/app-logo-icon';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';

export default function AuthCardLayout({
    children,
    title,
    description,
}: {
    children: React.ReactNode;
    name?: string;
    title?: string;
    description?: string;
}) {
    const { name: appName } = usePage<SharedData>().props;

    return (
        <div className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-background p-4 sm:p-6 md:p-10">
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_color-mix(in_srgb,var(--primary)_12%,transparent),transparent_55%)]"
            />
            <div
                aria-hidden
                className="pointer-events-none absolute -start-24 top-16 size-72 rounded-full bg-primary/10 blur-3xl"
            />
            <div
                aria-hidden
                className="pointer-events-none absolute -end-16 bottom-10 size-64 rounded-full bg-indigo-400/10 blur-3xl"
            />

            <div className="relative w-full max-w-md">
                <Link
                    href={route('home')}
                    className="mb-6 flex flex-col items-center gap-3 text-center transition-opacity duration-200 hover:opacity-90"
                >
                    <div className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md ring-4 ring-primary/10">
                        <AppLogoIcon className="size-7 fill-current" />
                    </div>
                    <div>
                        <p className="text-lg font-bold text-foreground">{appName}</p>
                        <p className="text-sm text-muted-foreground">نظام إدارة الحجوزات</p>
                    </div>
                </Link>

                <Card className="overflow-hidden border-border/80 shadow-lg">
                    <div className="h-1 bg-gradient-to-l from-primary via-indigo-500 to-emerald-500" />
                    <CardHeader className="space-y-2 px-6 pt-7 pb-0 text-center sm:px-8">
                        <CardTitle className="text-xl font-semibold">{title}</CardTitle>
                        {description && <CardDescription className="text-balance leading-relaxed">{description}</CardDescription>}
                    </CardHeader>
                    <CardContent className="px-6 py-7 sm:px-8">{children}</CardContent>
                </Card>
            </div>
        </div>
    );
}
