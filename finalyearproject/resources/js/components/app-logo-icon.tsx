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
            className={`object-contain ${className}`}
            style={mergedStyle}
            {...props}
        />
    );
}
