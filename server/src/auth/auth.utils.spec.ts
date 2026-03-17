import { ttlToMilliseconds } from "./auth.utils";

describe("ttlToMilliseconds", () => {
  it("converts minutes to milliseconds", () => {
    expect(ttlToMilliseconds("15m")).toBe(900000);
  });

  it("converts days to milliseconds", () => {
    expect(ttlToMilliseconds("7d")).toBe(604800000);
  });

  it("throws for unsupported input", () => {
    expect(() => ttlToMilliseconds("abc")).toThrow("Unsupported TTL value");
  });
});
