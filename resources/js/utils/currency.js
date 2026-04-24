
export const parseIDR = (string) => {
    if (!string) return 0;
    return parseInt(string.replace(/[^0-9]/g, ''), 10) || 0;
};

export const formatIDR = (amount) => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

export const formatCurrency = formatIDR;
