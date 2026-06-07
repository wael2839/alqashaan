import AppLogoIcon from './app-logo-icon';

export default function AppLogo() {
    return (
        <>
            <div className="flex aspect-square size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md transition-transform duration-200 ease-in-out hover:scale-105">
                <AppLogoIcon className="size-5 fill-current" />
            </div>
            <div className="ms-2 grid flex-1 text-start text-sm">
                <span className="truncate leading-none font-bold text-sidebar-foreground">قصر القشعان</span>
                <span className="truncate text-xs text-sidebar-foreground/55">نظام الحجوزات</span>
            </div>
        </>
    );
}
