/**
 * Centralized datetime formatting utilities for Roxy POS.
 * Avoids duplication across Dashboard, POS, and Attendance pages.
 */

export const formatDate = (date) => {
    return new Intl.DateTimeFormat('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    }).format(date);
};

export const formatTime = (date) => {
    return date.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
};
