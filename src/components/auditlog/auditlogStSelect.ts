import { ComponentCommand, ComponentContext } from "seyfert";
import { AuditCategory } from "src/utils/auditlog/registry";
import { renderCategoryView } from "src/utils/dashboard/auditlog/ALCatView";
import { renderEventView } from "src/utils/dashboard/auditlog/ALEventView";
import { dashboardPayload } from "src/utils/dashboard/auditlog/ALMainView";
import { assertAuthor } from "src/utils/onlyAuthor";

export default class AuditLogStringSelect extends ComponentCommand {
  componentType = "StringSelect" as const;

  filter(ctx: ComponentContext<typeof this.componentType>) {
    return ctx.customId === "alog:cat:select" || ctx.customId === "alog:evt:select";
  }

  async run(ctx: ComponentContext<typeof this.componentType>) {
    if (!(await assertAuthor(ctx))) return;

    const gId = ctx.guildId!;
    const sel = ctx.interaction.data.values[0];

    if (ctx.customId === "alog:cat:select") {
      return ctx.update(dashboardPayload(renderCategoryView(gId, sel as AuditCategory)));
    }

    // alog:evt:select
    return ctx.update(dashboardPayload(renderEventView(gId, sel)));
  }
}
