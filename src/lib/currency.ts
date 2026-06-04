const vnd = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

// Format a server-provided amount (VND) for display. Never compute price authority on device.
export function formatVnd(amount: number): string {
  return vnd.format(amount);
}
