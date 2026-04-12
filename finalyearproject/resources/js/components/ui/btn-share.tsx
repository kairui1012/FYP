import { Share2 } from 'lucide-react';

type BtnShareProps = {
	label?: string;
	className?: string;
	onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
};

export function BtnShare({ label = 'Share', className = '', onClick }: BtnShareProps) {
	const btnClass =
		'inline-flex items-center gap-2 rounded-full bg-zinc-200 px-3.5 py-1.5 font-semibold transition-colors cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-200 text-zinc-600 hover:bg-gradient-to-r hover:from-[#ef99b0] hover:to-pink-500 hover:text-white active:bg-rose-700 active:text-white group';

	return (
		<button
			type="button"
			className={`${btnClass} ${className}`.trim()}
			onClick={(event) => {
				event.stopPropagation();
				onClick?.(event);
			}}
		>
			<Share2 className="h-4 w-4 text-zinc-600 group-hover:text-white group-active:text-white transition-colors" />
			<span className="text-zinc-600 group-hover:text-white group-active:text-white transition-colors">
				{label}
			</span>
		</button>
	);
}
