import { SVGProps } from "react";

export function EzPerfilIcon(props: SVGProps<SVGSVGElement>) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-label="EZ Webinar Hub Logo"
            {...props}
        >
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
            <path d="M12.5 8.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z" />
            <path d="M17 12a3 3 0 0 0-3-3h-2.5" />
        </svg>
    );
}
