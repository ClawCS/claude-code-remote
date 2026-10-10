import { afterEach, expect, it } from "vitest";
import { maintenanceFixture } from "./fixtures/maintenance";
import { bindMaintenance, settleMaintenance } from "../src/worker-maintenance";
import { reconcileRestore } from "../src/restore";

const fixtures:Awaited<ReturnType<typeof maintenanceFixture>>[]=[];
afterEach(async()=>{for(const f of fixtures.splice(0)){await settleMaintenance(f.owner).catch(()=>{});await f.close();}});

it("keeps immutable cold origin and persistent authentication denial separate from bounded data progress",async()=>{
  const f=await maintenanceFixture("cold-maintenance",true); fixtures.push(f);
  bindMaintenance(f.owner,f.services,f.monotonicNow);
  const report=await reconcileRestore(f.owner);
  expect(report.authLocked).toBe(true);
  expect(report.status).toBe("progress");
  expect(report.consumedItems).toBeLessThanOrEqual(1000);
  expect(f.owner.custody.getIntakeReadiness().ready).toBe(false);
  expect(()=>f.owner.repository.listWorkerSchedule(f.owner.clock.now().toISOString() as never)).toThrow("REPOSITORY_COLD");
});
