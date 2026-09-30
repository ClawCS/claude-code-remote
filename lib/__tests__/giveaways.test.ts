import { describe, expect, test } from "vitest";
import { GIVEAWAYS_2026, type Giveaway } from "@/data/giveaways";
import { getActiveGiveaways, getGiveawayStatus, getMonthlyAgenda } from "@/lib/giveaways";

const instant = (value: string) => new Date(value);
const find = (id: string) => GIVEAWAYS_2026.find((entry) => entry.id === id)!;

describe("source-backed giveaway calendar", () => {
  test("preserves confirmed original prizes and the three additional spring/summer actions", () => {
    expect(find("2026-02").title).toBe("Ott Sports Sportpaket");
    expect(find("2026-04").description).toContain("Ballantine’s Special Kiss");
    expect(find("2026-easter").verifiedEndsDate).toBe("2026-04-04");
    expect(find("2026-faxe").verifiedEndsDate).toBe("2026-05-10");
    expect(find("2026-wm").verifiedEndsDate).toBe("2026-06-25");
    for (const id of ["2026-easter", "2026-faxe", "2026-wm"]) {
      expect(getGiveawayStatus(find(id), instant("2026-09-30T12:00:00.000Z"))).toBe("ended");
    }
  });
  test("keeps September open through the last Berlin millisecond and closes at October 1", () => {
    const september = find("2026-09");
    expect(getGiveawayStatus(september, instant("2026-09-30T21:59:59.999Z"))).toBe("active");
    expect(getGiveawayStatus(september, instant("2026-09-30T22:00:00.000Z"))).toBe("ended");
  });

  test.each([
    ["2026-02", "2026-02-28T22:59:59.999Z", "2026-02-28T23:00:00.000Z"],
    ["2026-03", "2026-03-29T21:59:59.999Z", "2026-03-29T22:00:00.000Z"],
    ["2026-07", "2026-08-01T21:59:59.999Z", "2026-08-01T22:00:00.000Z"],
  ])("uses the Berlin timezone for %s, including DST and a next-month deadline", (id, open, closed) => {
    expect(getGiveawayStatus(find(id), instant(open))).toBe("active");
    expect(getGiveawayStatus(find(id), instant(closed))).toBe("ended");
  });

  test("future calendar months are not active with a July clock", () => {
    expect(getGiveawayStatus(find("2026-09"), instant("2026-07-14T12:00:00.000Z"))).toBe("later");
    expect(getActiveGiveaways(instant("2026-07-14T12:00:00.000Z")).map((entry) => entry.id)).toEqual(["2026-07"]);
  });

  test("keeps Guinness separate and does not claim knowledge before its verification day", () => {
    const special = find("2026-guinness");
    expect(special.kind).toBe("special");
    expect(getGiveawayStatus(special, instant("2026-09-29T21:59:59.999Z"))).toBe("later");
    expect(getActiveGiveaways(instant("2026-09-30T12:00:00.000Z")).map((entry) => entry.id)).toEqual(["2026-09", "2026-guinness"]);
    expect(getActiveGiveaways(instant("2026-09-30T22:00:00.000Z")).map((entry) => entry.id)).toEqual(["2026-guinness"]);
    expect(getGiveawayStatus(special, instant("2026-10-03T21:59:59.999Z"))).toBe("active");
    expect(getGiveawayStatus(special, instant("2026-10-03T22:00:00.000Z"))).toBe("ended");
  });

  test("returns twelve agenda slots without invented October–December prizes", () => {
    const agenda = getMonthlyAgenda(2026, instant("2026-09-30T12:00:00.000Z"));
    expect(agenda).toHaveLength(12);
    expect(agenda.slice(9).map(({ month, giveaway, status }) => ({ month, giveaway, status }))).toEqual([
      { month: 10, giveaway: null, status: "unannounced" },
      { month: 11, giveaway: null, status: "unannounced" },
      { month: 12, giveaway: null, status: "unannounced" },
    ]);
    expect(agenda.filter((slot) => slot.giveaway).map((slot) => slot.giveaway!.sourceURL)).toEqual([
      "https://www.instagram.com/trinkgutjammers_goch/p/DT0ZAQEDOc9/",
      "https://www.instagram.com/trinkgutjammers_goch/p/DUQ-IgEjMMv/",
      "https://www.instagram.com/trinkgutjammers_goch/p/DVWA1xvDN-J/",
      "https://www.instagram.com/trinkgutjammers_goch/p/DW09zp_jCcO/",
      "https://www.instagram.com/trinkgutjammers_goch/p/DX81IbTMW-M/",
      "https://www.instagram.com/trinkgutjammers_goch/p/DZFhvs5s7a7/",
      "https://www.instagram.com/trinkgutjammers_goch/p/DaSlTlAM1-y/",
      "https://www.instagram.com/trinkgutjammers_goch/p/DbRH2Tds4dc/",
      "https://www.instagram.com/trinkgutjammers_goch/p/DcsoYTBMQLJ/",
    ]);
  });

  test("retains the 2026 archive after the year changes without promoting old actions", () => {
    const now = instant("2027-01-01T00:00:00.000Z");
    expect(getMonthlyAgenda(2026, now).slice(0, 9).map((slot) => slot.status)).toEqual(Array(9).fill("ended"));
    expect(getActiveGiveaways(now)).toEqual([]);
    expect(getMonthlyAgenda(2027, now).every((slot) => slot.giveaway === null)).toBe(true);
  });

  test("does not import a 2025 May record into the 2026 agenda", () => {
    const historical: Giveaway = { ...find("2026-05"), id: "2025-05", year: 2025, verifiedEndsDate: "2025-05-31" };
    const agenda = getMonthlyAgenda(2026, instant("2026-09-30T12:00:00.000Z"), [historical]);
    expect(agenda.every((slot) => slot.giveaway === null)).toBe(true);
    expect(getMonthlyAgenda(2026, instant("2026-09-30T12:00:00.000Z"), []).every((slot) => slot.status === "unannounced")).toBe(true);
  });
});
