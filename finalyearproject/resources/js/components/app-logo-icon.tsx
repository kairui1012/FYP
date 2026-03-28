import type { CSSProperties, ImgHTMLAttributes } from 'react';

export default function AppLogoIcon({
    className = '',
    style,
    ...props
}: ImgHTMLAttributes<HTMLImageElement>) {
    const mergedStyle: CSSProperties = {
        transform: 'scale(1)',
        transformOrigin: 'center',
        ...style,
    };

    return (
        <img
            src="/images/app-logo.svg"
            alt="App logo"
            className={`h-14 w-14 object-contain ${className}`}
            style={mergedStyle}
            {...props}
        />
    );
}
