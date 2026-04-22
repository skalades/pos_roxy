export const formatIDR = (number) => {
    if (number === null || number === undefined) return '';
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(number);
};

export const parseIDR = (string) => {
    if (!string) return 0;
    return parseInt(string.replace(/[^0-9]/g, ''), 10) || 0;
};
