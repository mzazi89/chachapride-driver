// Client-safe currency formatting (Kenyan Shillings)
export const fmtKsh = (n) => {
  const v = Number(n);
  const s = Number.isFinite(v) ? (v % 1 === 0 ? v.toLocaleString() : v.toFixed(2)) : '0';
  return `KSh ${s}`;
};
