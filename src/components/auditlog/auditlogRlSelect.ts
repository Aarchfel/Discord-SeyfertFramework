import { ComponentCommand, ComponentContext } from "seyfert";
import { renderEventView } from "src/utils/dashboard/auditlog/ALEventView";
import { dashboardPayload } from "src/utils/dashboard/auditlog/ALMainView";
import { AuditlogService } from "src/utils/database/auditlogService";
import { assertAuthor } from "src/utils/onlyAuthor";

export default class AuditLogRoleSelect extends ComponentCommand {
  componentType = "RoleSelect" as const;

  filter(context: ComponentContext<typeof this.componentType>) {
    return context.customId.startsWith("alog:evt:pingrole");
  }

  async run(ctx: ComponentContext<typeof this.componentType>) {
    if (!(await assertAuthor(ctx))) return;

    const gId = ctx.guildId!;
    const eventKey = ctx.customId.split(":")[3];
    const vals = ctx.interaction.data.values;
    const rId = vals[0] ?? null;

    AuditlogService.setEventPingRole(gId, eventKey as any, rId);
    return ctx.update(dashboardPayload(renderEventView(gId, eventKey)));
  }
}
