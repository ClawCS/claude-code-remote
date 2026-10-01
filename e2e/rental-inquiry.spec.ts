import { test, expect } from "@playwright/test";

test("rental selection, repeated additions and cart updates respect overlapping physical stock", async ({page}) => {
  await page.goto("/vermietung");
  await expect(page.locator("article[data-physical-stock]")).toHaveCount(20);
  await page.getByLabel("Gewünschte Abholung").fill("2026-10-05");
  await page.getByLabel("Gewünschte Rückgabe").fill("2026-10-07");
  const trailer = page.getByRole("spinbutton",{name:"Menge für Kühlanhänger",exact:true});
  await trailer.fill("2");
  await page.getByRole("button",{name:"In den Warenkorb",exact:true}).click();
  await page.getByRole("dialog").getByRole("button",{name:"Schließen",exact:true}).click();
  await expect(trailer).toHaveAttribute("max","1");
  await trailer.fill("999");
  await expect(trailer).toHaveValue("1");
  await page.getByRole("button",{name:"In den Warenkorb",exact:true}).click();
  await page.getByRole("dialog").getByRole("button",{name:"Schließen",exact:true}).click();
  await expect(trailer).toHaveAttribute("max","0");
  await page.goto("/warenkorb");
  await page.getByRole("button",{name:"Menge für Kühlanhänger erhöhen",exact:true}).click();
  await expect.poll(()=>page.evaluate(()=>JSON.parse(sessionStorage.getItem("trinkgut-cart") ?? "[]")[0]?.quantity)).toBe(3);
  await page.goto("/vermietung");
  await page.getByLabel("Gewünschte Abholung").fill("2026-10-07");
  await page.getByLabel("Gewünschte Rückgabe").fill("2026-10-10");
  await expect(trailer).toHaveAttribute("max","0");
  await trailer.fill("999");
  await expect(trailer).toHaveValue("0");
  await expect(page.getByRole("button",{name:"In den Warenkorb",exact:true})).toBeDisabled();
  await page.getByLabel("Gewünschte Abholung").fill("2026-10-08");
  await expect(trailer).toHaveAttribute("max","3");
  await trailer.fill("3");
  await page.getByRole("button",{name:"In den Warenkorb",exact:true}).click();
  await page.getByRole("dialog").getByRole("button",{name:"Schließen",exact:true}).click();
  await page.goto("/checkout");
  await expect(page.getByRole("heading",{name:"Reservierung unverbindlich anfragen"})).toBeVisible();
  await expect(page.getByText("3 × Kühlanhänger",{exact:true})).toHaveCount(2);
  await expect(page.getByText("Gewünschter Leihzeitraum: 2026-10-05 bis 2026-10-07",{exact:true})).toBeVisible();
  await expect(page.getByText("Gewünschter Leihzeitraum: 2026-10-08 bis 2026-10-10",{exact:true})).toBeVisible();
});

test("restored browser rental data is canonical, capped and does not restore old aliases", async ({page}) => {
  await page.addInitScript(()=>{
    const rental={startDate:"2026-10-05",endDate:"2026-10-07",workdays:3,periods:99,basePrice:999,totalRentalPrice:999};
    sessionStorage.setItem("trinkgut-cart",JSON.stringify([
      {product:{id:20001,name:"Forged stale label"},quantity:99,rental},
      {product:{id:20001},quantity:99,rental:{...rental,startDate:"2026-10-06",endDate:"2026-10-09"}},
      {product:{id:1003,name:"Kühlwagen (mit Getränken)"},quantity:99,rental},
    ]));
  });
  await page.goto("/checkout");
  await expect(page.getByText("3 × Kühlanhänger",{exact:true})).toBeVisible();
  await expect(page.getByText("Forged stale label",{exact:true})).toHaveCount(0);
  await expect(page.getByText("Kühlwagen (mit Getränken)",{exact:true})).toHaveCount(0);
  const stored=await page.evaluate(()=>JSON.parse(sessionStorage.getItem("trinkgut-cart") ?? "[]"));
  expect(stored).toHaveLength(1);
  expect(stored[0]).toMatchObject({quantity:3,product:{name:"Kühlanhänger",price:0},rental:{periods:0,basePrice:0,totalRentalPrice:0,priceStatus:"personal-confirmation-required"}});
});
