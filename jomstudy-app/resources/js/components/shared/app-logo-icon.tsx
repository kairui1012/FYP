import { reactLang } from '@erag/lang-sync-inertia';
import type { CSSProperties, ImgHTMLAttributes } from 'react';

export default function AppLogoIcon({
    className = '',
    style,
    ...props
}: ImgHTMLAttributes<HTMLImageElement>) {
    const { trans } = reactLang();
    const mergedStyle: CSSProperties = {
        transform: 'scale(1)',
        transformOrigin: 'center',
        ...style,
    };

    return (
        <img
            src="/images/app-logo.svg"
            alt={trans('navigation.app_logo_alt')}
            className={`object-contain ${className}`}
            style={mergedStyle}
            {...props}
        />
    );
}
