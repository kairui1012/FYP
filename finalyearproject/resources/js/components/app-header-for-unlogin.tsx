import { Link, usePage } from '@inertiajs/react';
import {
    Bell,
    Languages,
    Menu,
    Plus,
    Search,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import AppLogoIcon from '@/components/app-logo-icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { homePage, login, register } from '@/routes';

export function AppHeaderForUnlogin() {
    const page = usePage();
    const auth = page.props.auth as { user?: { name?: string } | null } | undefined;
    const isLoggedIn = Boolean(auth?.user);

    return (
        <>
            <div className="border-b border-sidebar-border/80">
                <div className="flex h-16 w-full items-center px-2 md:px-8">
                    {/* Mobile Menu */}
                    <div className="lg:hidden">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="mr-2 h-8.5 w-8.5"
                                >
                                    <Menu className="h-5 w-5" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent
                                side="left"
                                className="flex h-full w-64 flex-col items-stretch justify-between bg-sidebar"
                            >
                                <SheetTitle className="sr-only">
                                    Navigation menu
                                </SheetTitle>
                                <SheetHeader className="flex justify-start text-left">
                                    <AppLogoIcon className="h-6 w-6 fill-current text-black dark:text-white" />
                                </SheetHeader>
                                <div className="flex h-full flex-1 flex-col space-y-4 p-4">
                                    <div className="flex h-full flex-col justify-between text-sm">
                                        <div className="flex flex-col space-y-4">
                                            <Link href={homePage()} className="font-medium">
                                                Home
                                            </Link>
                                        </div>

                                        <div className="flex flex-col space-y-3">
                                            <Link href={login()} className="font-medium">
                                                Login
                                            </Link>
                                            <Link href={register()} className="font-medium">
                                                Register
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>

                    <Link
                        href={homePage()}
                        prefetch
                        className="flex min-w-0 items-center gap-2"
                    >
                        <AppLogo />
                    </Link>


                    {/* Desktop Navigation */}

                    <div className="ml-auto flex items-center space-x-5">
                        

                        <Link
                            href="/change-language-setting"
                            className="hidden md:inline-flex"
                            aria-label="Change language setting"
                        >
                            <Button variant="ghost" size="icon" className="size-9 bg-[#de6b89]">
                                <Languages className="h-4.5 w-4.5" />
                            </Button>
                        </Link>

                        {!isLoggedIn && (
                            <>
                                 <Button asChild className="hidden md:inline-flex bg-[#de6b89]">
                                    <Link href={login()}>Login</Link>
                                </Button>
                                <Button asChild className="hidden md:inline-flex bg-[#de6b89]">
                                    <Link href={register()}>Register</Link>
                                </Button>
                            </>
                        )}
                        
                    </div>
                </div>
            </div>
        </>
    );
}
