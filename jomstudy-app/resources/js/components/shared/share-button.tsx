import { reactLang } from '@erag/lang-sync-inertia';
import { Share2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

type BtnShareProps = {
	label?: string;
	className?: string;
	postId?: number;
};

export function BtnShare({ label, className = '', postId }: BtnShareProps) {
	const { trans } = reactLang();
	const shareLabel = label ?? trans('navigation.share');
	const btnClass =
  	'inline-flex items-center gap-2 rounded-full bg-zinc-200 px-3.5 py-1.5 font-semibold transition-colors cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-200 text-zinc-600 hover:bg-gradient-to-r hover:from-purple-400 hover:to-indigo-500 hover:text-white active:bg-purple-700 active:text-white group';

	const handleCopy = async (event: React.MouseEvent<HTMLButtonElement>) => {
		event.stopPropagation();

		const url = postId
			? `${window.location.origin}/posts/${postId}`
			: window.location.href;

		try {
			await navigator.clipboard.writeText(url);
			toast.success(trans('navigation.share_link_copied'));
		} catch (err) {
			console.error('Failed to copy:', err);
			toast.error(trans('navigation.share_link_copy_failed'));
		}
	};

	return (
		<button type="button" className={`${btnClass} ${className}`} onClick={handleCopy}>
			<Share2 className="h-4 w-4 text-zinc-600 group-hover:text-white group-active:text-white transition-colors" />
			<span className="text-zinc-600 group-hover:text-white group-active:text-white transition-colors">
				{shareLabel}
			</span>
		</button>
	);
}
