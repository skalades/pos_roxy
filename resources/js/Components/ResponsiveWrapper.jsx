import React from 'react';

export default function ResponsiveWrapper({ children }) {
    return (
        <div className="flex flex-col h-screen w-full bg-roxy-canvas text-roxy-textMain">
            {/* The main container will stack vertically on portrait, and side-by-side on landscape */}
            <div className="flex flex-1 overflow-hidden flex-col portrait:flex-col landscape:flex-row">
                {children}
            </div>
        </div>
    );
}
