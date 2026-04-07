import AppLogoIcon from '@/components/app-logo-icon';

export default function AppLogo() {
    return (
        <>
            <div className="flex aspect-square items-center">
                <AppLogoIcon className="size-[clamp(1.25rem,1.1vw+0.75rem,1.75rem)] fill-current " />
            </div>
            
            <div className=" flex min-w-0 flex-col justify-center overflow-hidden leading-none">
                <span className="truncate text-[clamp(1.125rem,0.9vw+0.75rem,1.5rem)] font-bold -tracking-normal text-zinc-900 dark:text-zinc-100">
                    Jom
                    <span className="inline-block text-[#e36a8b] dark:text-[#F0838F]">Study</span>
                </span>
            </div>
        </>
    );
}