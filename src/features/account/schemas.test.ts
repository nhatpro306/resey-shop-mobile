import { addressSchema, profileSchema } from "./schemas";

describe("addressSchema", () => {
  it("accepts a valid address", () => {
    const r = addressSchema.safeParse({
      street: "123 Le Loi",
      city: "Ho Chi Minh",
      country: "Vietnam",
    });
    expect(r.success).toBe(true);
  });

  it("rejects a short street", () => {
    const r = addressSchema.safeParse({ street: "1", city: "HCM", country: "Vietnam" });
    expect(r.success).toBe(false);
  });

  it("rejects a missing country", () => {
    const r = addressSchema.safeParse({ street: "123 Le Loi", city: "HCM" });
    expect(r.success).toBe(false);
  });
});

describe("profileSchema", () => {
  it("accepts a valid username", () => {
    expect(profileSchema.safeParse({ username: "nhat" }).success).toBe(true);
  });
  it("rejects a 1-char username", () => {
    expect(profileSchema.safeParse({ username: "n" }).success).toBe(false);
  });
});
