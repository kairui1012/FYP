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
            className="hidden h-9 rounded-full border-transparent bg-[#ee7d9b] text-white shadow-none transition-colors duration-200 hover:border-transparent hover:bg-[#e7849e] hover:text-white hover:shadow-none focus-visible:border-transparent focus-visible:ring-[#e36a8b]/35 md:mr-[5%] md:inline-flex dark:border-transparent dark:bg-[#F0838F] dark:text-white dark:hover:border-transparent dark:hover:bg-[#e07481] dark:focus-visible:border-transparent dark:focus-visible:ring-[#F0838F]/30"
        >
            <Link href="/createPostPage" prefetch>
                <Plus className="mr-1 h-4 w-4" />
                {trans('navigation.create_post')}
            </Link>
        </Button>
    );
}
