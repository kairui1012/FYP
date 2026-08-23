import { Send } from 'lucide-react';

import { Button } from '@/component-new/button/button';

type SubmitPostButtonProps = {
    canSubmit: boolean;
    isSubmitting: boolean;
    publishingText: string;
    publishText: string;
    className: string;
};

export function SubmitPostButton({
    canSubmit,
    isSubmitting,
    publishingText,
    publishText,
    className,
}: SubmitPostButtonProps) {
    return (
        <Button type="submit" disabled={!canSubmit} className={className}>
            {isSubmitting ? (
                <>
                    <Send className="mr-2 h-4 w-4 animate-spin" />
                    {publishingText}
                </>
            ) : (
                <>
                    <Send className="mr-2 h-4 w-4" />
                    {publishText}
                </>
            )}
        </Button>
    );
}
