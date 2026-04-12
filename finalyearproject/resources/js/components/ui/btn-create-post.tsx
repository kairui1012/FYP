import { Link } from '@inertiajs/react';
import { reactLang } from '@erag/lang-sync-inertia';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function BtnCreatePost() {
    const { trans } = reactLang();

    return (
        <Button
            asChild
            variant="outline"
            className="hidden h-9 rounded-full border-2 border-[#ef99b0] bg-linear-to-r from-[#ef99b0] to-[#e27193] text-white transition-all duration-200 hover:border-[#d85380] hover:from-[#f5c4d6] hover:to-[#f39db8] hover:text-black hover:shadow-[0_4px_12px_rgba(227,106,139,0.3)] focus-visible:border-[#d85380] focus-visible:ring-[#e36a8b]/35 md:mr-[5%] md:inline-flex dark:border-[#ef99b0] dark:bg-linear-to-r dark:from-[#ef99b0] dark:to-[#e27193] dark:text-white dark:hover:border-[#d85380] dark:hover:from-[#f5c4d6] dark:hover:to-[#f39db8] dark:hover:text-black dark:hover:shadow-[0_4px_12px_rgba(227,106,139,0.3)] dark:focus-visible:border-[#d85380]"
        >
            <Link href="/createPostPage" prefetch>
                <Plus className="mr-1 h-4 w-4" />
                {trans('navigation.create_post')}
            </Link>
        </Button>
    );
}
