import AppLogoIcon from '@/components/app-logo-icon';

export default function AppLogo() {
    return (
        <>
            <div className="flex aspect-square size-9 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground shadow-sm">
                <AppLogoIcon className="size-5 fill-current text-white dark:text-black" />
            </div>
            
            <div className="ml-2 flex min-w-0 flex-col justify-center overflow-hidden leading-none">
                <span className="truncate text-2xl font-bold -tracking-normal text-zinc-900 dark:text-zinc-100">
                    Jom
                    <span className="inline-block text-[#e36a8b] dark:text-[#F0838F]">Study</span>
                </span>
            </div>
        </>
    );
}