import React from 'react';
import { Link } from '@inertiajs/react';

export default function Pagination({ links }) {
    if (!links || links.length <= 3) return null; // Don't show pagination if there's only 1 page (prev, 1, next)

    return (
        <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
            {links.map((link, index) => {
                let label = link.label
                    .replace(/&laquo; Previous/g, '‹ Prev')
                    .replace(/Next &raquo;/g, 'Next ›');

                return link.url === null ? (
                    <div
                        key={index}
                        className="px-4 py-2 text-sm font-bold text-slate-400 bg-slate-50 border border-slate-100 rounded-xl cursor-not-allowed"
                        dangerouslySetInnerHTML={{ __html: label }}
                    />
                ) : (
                    <Link
                        key={index}
                        href={link.url}
                        preserveState
                        className={`px-4 py-2 text-sm font-bold rounded-xl transition-all ${
                            link.active
                                ? 'bg-roxy-primary text-white shadow-lg shadow-roxy-primary/20'
                                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-roxy-primary'
                        }`}
                        dangerouslySetInnerHTML={{ __html: label }}
                    />
                );
            })}
        </div>
    );
}
