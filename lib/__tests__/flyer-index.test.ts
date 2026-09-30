import { afterEach, describe, expect, it, vi } from "vitest";
const mocks=vi.hoisted(()=>({official:vi.fn(),packages:vi.fn()}));
vi.mock("@/lib/handzettel-catalog",()=>({loadValidatedHandzettelCache:mocks.official}));
vi.mock("@/lib/flyer-packages",()=>({loadFlyerPackages:mocks.packages,selectActiveFlyerPackages:()=>[]}));
import { getFlyerIndex } from "@/lib/flyer-index";
afterEach(()=>vi.restoreAllMocks());
describe("flyer index reports runtime integrity failures",()=>{
  it("allows a valid empty selection on Sunday outside the weekly offer period",async()=>{
    mocks.official.mockResolvedValue(null);mocks.packages.mockResolvedValue([]);
    const index=await getFlyerIndex(new Date("2026-10-04T12:00:00Z"));
    expect(index.status).toBe("ok");expect(index.issues).toEqual([]);
  });
  it("reports a missing mandatory official flyer during the active week",async()=>{
    mocks.official.mockResolvedValue(null);mocks.packages.mockResolvedValue([]);
    const index=await getFlyerIndex(new Date("2026-09-30T12:00:00Z"));
    expect(index.status).toBe("degraded");expect(index.issues).toEqual(["official-flyer-missing"]);
    expect(index.flyers).toEqual([]);
  });
  it("withholds corrupted packages but exposes degraded status and logs no private details",async()=>{
    mocks.official.mockResolvedValue(null);mocks.packages.mockRejectedValue(new Error("private/path/details"));
    const log=vi.spyOn(console,"error").mockImplementation(()=>{});
    const index=await getFlyerIndex(new Date("2026-10-04T12:00:00Z"));
    expect(index.status).toBe("degraded");expect(index.issues).toEqual(["local-flyer-integrity"]);expect(index.flyers).toEqual([]);
    expect(log).toHaveBeenCalledTimes(1);expect(JSON.stringify(log.mock.calls)).not.toContain("private/path/details");
  });
});
