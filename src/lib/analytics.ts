// Typed analytics event map. No-op until a provider (PostHog/Firebase) is wired in M7.
// Centralizing events here keeps tracking consistent and greppable.
type EventMap = {
  view_home: undefined;
  view_catalog: { categoryId?: number };
  view_product: { slug: string };
  add_to_cart: { productId: string; quantity: number };
  begin_checkout: { itemCount: number; total: number };
  purchase: { orderId: number; total: number; paymentMethod: string };
  sign_in: undefined;
  sign_up: undefined;
};

export function track<E extends keyof EventMap>(
  event: E,
  ...args: EventMap[E] extends undefined ? [] : [EventMap[E]]
): void {
  const payload = args[0];
  if (__DEV__) console.log(`[analytics] ${String(event)}`, payload ?? "");
  // TODO(M7): forward to PostHog/Firebase Analytics.
}
