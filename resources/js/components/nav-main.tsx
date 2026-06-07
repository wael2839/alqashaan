import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';

export function NavMain({ items = [] }: { items: NavItem[] }) {
    const page = usePage();

    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel className="text-start text-xs font-semibold tracking-wide text-sidebar-foreground/50 uppercase">
                القائمة الرئيسية
            </SidebarGroupLabel>
            <SidebarMenu className="gap-1">
                {items.map((item) => {
                    const isActive = page.url.startsWith(item.url);

                    return (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                asChild
                                isActive={isActive}
                                className="sidebar-nav-item h-10 text-start"
                                data-active={isActive ? 'true' : 'false'}
                            >
                                <Link href={item.url} prefetch>
                                    {item.icon && <item.icon className="size-[18px] text-current transition-transform duration-200 group-hover/menu-item:scale-110" />}
                                    <span>{item.title}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    );
                })}
            </SidebarMenu>
        </SidebarGroup>
    );
}
