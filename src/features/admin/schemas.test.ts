import { productFormSchema, storeSettingsSchema } from "./schemas";

describe("productFormSchema", () => {
  it("coerces numeric strings and accepts a valid product", () => {
    const r = productFormSchema.safeParse({
      title: "Hoodie",
      description: "Black hoodie",
      price: "250000",
      stock: "10",
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.price).toBe(250000);
      expect(r.data.stock).toBe(10);
    }
  });

  it("rejects a zero/negative price", () => {
    expect(productFormSchema.safeParse({ title: "X", description: "d", price: "0", stock: "1" }).success).toBe(false);
  });

  it("rejects negative stock", () => {
    expect(productFormSchema.safeParse({ title: "X", description: "d", price: "10", stock: "-1" }).success).toBe(false);
  });
});

describe("storeSettingsSchema", () => {
  it("accepts an empty contact email", () => {
    expect(storeSettingsSchema.safeParse({ contact_email: "" }).success).toBe(true);
  });
  it("rejects an invalid contact email", () => {
    expect(storeSettingsSchema.safeParse({ contact_email: "nope" }).success).toBe(false);
  });
  it("coerces shipping fee", () => {
    const r = storeSettingsSchema.safeParse({ shipping_fee: "30000" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.shipping_fee).toBe(30000);
  });
});
