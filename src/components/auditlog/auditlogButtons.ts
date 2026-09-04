import { ComponentCommand, ComponentContext, MessageFlags } from "seyfert";
import { AuditCategory } from "src/utils/auditlog/registry";
import { renderCategoryView } from "src/utils/dashboard/auditlog/ALCatView";
import { renderEventView } from "src/utils/dashboard/auditlog/ALEventView";
import { dashboardPayload, renderMainView } from "src/utils/dashboard/auditlog/ALMainView";
import { AuditlogService } from "src/utils/database/auditlogService";
import { assertAuthor } from "src/utils/onlyAuthor";

export default class AuditLogButtons extends ComponentCommand {
  componentType = "Button" as const;

  filter(ctx: ComponentContext<typeof this.componentType>) {
    return ctx.customId.startsWith("alog:");
  }

  async run(ctx: ComponentContext<typeof this.componentType>) {
    if (!(await assertAuthor(ctx))) return;

    const gId = ctx.guildId!;
    const [, action, ...rest] = ctx.customId.split(":");

    /// alog:master:toggle
    if (action === "master" && rest[0] === "toggle") {
      AuditlogService.setEnabled(gId, !AuditlogService.isEnabled(gId));
      return ctx.update(dashboardPayload(renderMainView(gId)));
    }

    // alog:back:main
    if (action === "back" && rest[0] === "main") {
      return ctx.update(dashboardPayload(renderMainView(gId)));
    }

    // alog:back:cat:{category}
    if (action === "back" && rest[0] === "cat") {
      const category = rest[1] as AuditCategory;
      return ctx.update(dashboardPayload(renderCategoryView(gId, category)));
    }

    // alog:evt:togle:{eventKey}
    if (action === "evt" && rest[0] === "toggle") {
      const eventKey = rest[1];
      AuditlogService.toggleEventEnabled(gId, eventKey as any);
      return ctx.update(dashboardPayload(renderEventView(gId, eventKey)));
    }

    return ctx.write({content: "Unknowned action", flags: MessageFlags.Ephemeral});
  }
}
