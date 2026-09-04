import { ChannelSelectMenu, ChannelType, ComponentCommand, type ComponentContext, Modal, RoleSelectMenu, TextInputStyle, TextInput, Label } from "seyfert";
import { SetupTitle, SetupType } from "src/utils/dashboard/setupDefs";
import { getCustomizeConfig, getGuildConfig } from "src/utils/database/guildConfig";
import { assertAuthor } from "src/utils/onlyAuthor";

export default class setupModals extends ComponentCommand {
  componentType = "Button" as const;

  filter(ctx: ComponentContext) {
    return ctx.customId.startsWith("modal_setup_");
  }

  async run(ctx: ComponentContext<typeof this.componentType>) {
    if (!ctx.guildId) return;
    if (!(await assertAuthor(ctx))) return;

    const type = ctx.customId.replace("modal_setup_", "") as SetupType;
    const ccfg = getCustomizeConfig(ctx.guildId);
    const gcfg = getGuildConfig(ctx.guildId);

    if (!SetupTitle[type]) return;

    const modal = new Modal()
      .setTitle(SetupTitle[type])
      .setCustomId(`modal_submit_setup_${type}`)

    const chSelect = (cId: string, placeholder: string, defVal?: string | null) => {
      const menu = new ChannelSelectMenu()
        .setCustomId(cId)
        .setPlaceholder(placeholder)
        .setChannelTypes([ChannelType.GuildText])
        .setValuesLength({min: 0, max: 1})
      if (defVal) menu.setDefaultChannels([defVal]);
      return menu;
    };

    const rlSelect = (cId: string, placeholder: string, maxVal: number = 1, defVal?: string[]) => {
      const menu = new RoleSelectMenu()
        .setCustomId(cId)
        .setPlaceholder(placeholder)
        .setValuesLength({min: 0, max: maxVal})
      if (defVal && defVal.length > 0) menu.setDefaultRoles(defVal);
      return menu;
    };

    const tInput = (
      cId: string,
      placeholder: string,
      defVal?: string | null,
      style = TextInputStyle.Paragraph
    ) => {
      const input = new TextInput()
        .setCustomId(cId)
        .setStyle(style)
        .setPlaceholder(placeholder)
        .setRequired(false);
      if (defVal) input.setValue(defVal);
      return input;
    };
    
    const cMap: Record<SetupType, Label[]> = {
      welcome: [
        new Label().setLabel("Welcome Channel").setComponent(
          chSelect("welcome_channel", "Select/Delete Welcome Channel", gcfg.welcome_channel).setRequired(false)
        ),
        new Label().setLabel("Embed Color (Hex)").setComponent(
          tInput("welcome_color", "Hex Color #FFFFFF", ccfg.welcome_color, TextInputStyle.Short).setRequired(false)
        ),
        new Label().setLabel("Welcome Message").setComponent(
          tInput("welcome_message", "Welcome {username} to {servername}..", ccfg.welcome_message).setRequired(false)
        ),
        new Label().setLabel("Auto Join Role").setComponent(
          rlSelect("default_role", "Select Auto Join Role", 1, gcfg.default_role ? [gcfg.default_role] : []).setRequired(false)
        ),
        new Label().setLabel("Greet Message").setComponent(
          tInput("greet_message", "Thanks {username} for joining {servername}..", ccfg.greet_message).setRequired(false)
        ),
      ],

      leave: [
        new Label().setLabel("Leave Channel").setComponent(
          chSelect("leave_channel", "Select/Delete Leave Channel", gcfg.leave_channel).setRequired(false)
        ),
        new Label().setLabel("Embed Color (Hex)").setComponent(
          tInput("leave_color", "Hex Color #FFFFFF", ccfg.leave_color, TextInputStyle.Short).setRequired(false)
        ),
        new Label().setLabel("Leave Message").setComponent(
          tInput("leave_message", "{username} has left the server..", ccfg.leave_message).setRequired(false)
        ),
      ],

      log: [
        new Label().setLabel("Log Channel").setComponent(
          chSelect("log_channel", "Select/Delete Log Channel", gcfg.log_channel).setRequired(false)
        ),
      ],

      anonymous: [
        new Label().setLabel("Anonymous Channel").setComponent(
          chSelect("anonymous_channel", "Select/Delete Anonymous Channel", gcfg.anonymous_channel).setRequired(false)
        ),
        new Label().setLabel("Anonymous Log Channel").setComponent(
          chSelect("anonymouslog_channel", "Select/Delete Anonymous Log Channel", gcfg.anonymouslog_channel).setRequired(false)
        ),
      ],
      
      qotd: [
        new Label().setLabel("Quote of the Day Channel").setComponent(
          chSelect("qotd_channel", "Select/Delete Quote of the Day Channel", gcfg.qotd_channel).setRequired(false)
        ),
      ],
    };

    const components = cMap[type];
    if (components) {
      modal.addComponents(components);
      await ctx.modal(modal);
    }
  }
}
