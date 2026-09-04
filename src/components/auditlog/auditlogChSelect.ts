import { ComponentCommand, ComponentContext } from "seyfert";
import { AuditCategory } from "src/utils/auditlog/registry";
import { renderCategoryView } from "src/utils/dashboard/auditlog/ALCatView";
import { dashboardPayload, renderMainView } from "src/utils/dashboard/auditlog/ALMainView";
import { AuditlogService } from "src/utils/database/auditlogService";
import { assertAuthor } from "src/utils/onlyAuthor";

export default class AuditLogChannelSelect extends ComponentCommand {
  componentType = "ChannelSelect" as const;

  filter(ctx: ComponentContext<typeof this.componentType>) {
    return ctx.customId === "alog:channel:default" || ctx.customId.startsWith("alog:channel:cat");
  }

  async run(ctx: ComponentContext<typeof this.componentType>) {
    if (!(await assertAuthor(ctx))) return;

    const gId = ctx.guildId!;
    const vals = ctx.interaction.data.values;
    const cId = vals[0] ?? null;

    if (ctx.customId === "alog:channel:default") {
      AuditlogService.setDefaultChannel(gId, cId);
      return ctx.update(dashboardPayload(renderMainView(gId)));
    }

    // alog:channel:cat:{category}
    const category = ctx.customId.split(":")[3] as AuditCategory;
    if (cId) {
      AuditlogService.setCategoryChannel(gId, category, cId);
    } else {
      AuditlogService.clearCategoryChannel(gId, category);
    }

    return ctx.update(dashboardPayload(renderCategoryView(gId, category)));
  }
}
