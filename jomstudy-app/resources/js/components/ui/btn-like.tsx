import { Heart } from 'lucide-react';
import { useState } from 'react';

type BtnLikeProps = {
	count: number;
	liked?: boolean;
	loading?: boolean;
	className?: string;
	onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
};

export function BtnLike({
	count,
	liked = false,
	loading = false,
	className = '',
	onClick,
}: BtnLikeProps) {
	const [showBurst, setShowBurst] = useState(false);

	const btnClass =
		'group relative inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 font-semibold transition-colors cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-200 disabled:cursor-not-allowed disabled:opacity-70';

	const activeClass = liked
		? 'bg-rose-500 text-white ring-2 ring-rose-200/80 shadow-[0_8px_20px_rgba(244,63,94,0.35)]'
		: 'bg-zinc-200 text-zinc-600';

	return (
		<button
			type="button"
			disabled={loading}
			className={`${btnClass} ${activeClass} ${className}`.trim()}
			onClick={(event) => {
				event.stopPropagation();

				if (!liked) {
					setShowBurst(true);
					window.setTimeout(() => setShowBurst(false), 260);
				}

				onClick?.(event);
			}}
		>
			{showBurst ? (
				<Heart className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-ping fill-rose-300 text-rose-300" />
			) : null}
			<Heart
				className={`h-4 w-4 transition-colors ${
					liked
						? 'fill-white text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]'
						: 'text-zinc-600'
				}`}
			/>
			<span
				className={`transition-colors ${
					liked
						? 'text-white'
						: 'text-zinc-600'
				}`}
			>
				{count}
			</span>
		</button>
	);
}
