import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { type BreadcrumbItem as BreadcrumbItemType } from '@/types';

export function AppSidebarHeader({ breadcrumbs = [] }: { breadcrumbs?: BreadcrumbItemType[] }) {
    return (
        <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-card/90 px-4 shadow-sm backdrop-blur-md transition-all duration-200 ease-in-out group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 sm:px-5 md:px-6">
            <SidebarTrigger className="sidebar-trigger-rtl -me-1 rounded-xl text-muted-foreground transition-all duration-200 ease-in-out hover:bg-accent hover:text-accent-foreground" />
            <Breadcrumbs breadcrumbs={breadcrumbs} />
        </header>
    );
}
