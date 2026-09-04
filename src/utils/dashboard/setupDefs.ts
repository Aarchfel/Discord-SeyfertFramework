export type SetupType = "welcome" | "leave" | "log" | "anonymous" | "qotd";
export type FieldTarget = "guild" | "customize";

export interface FieldDescriptor {
  inputId: string;
  column: string;
  target: FieldTarget;
  isSelect: boolean;
}

export const SetupTitle: Record<SetupType, string> = {
  welcome: "Setup Welcome Embed",
  leave: "Setup Leave Embed",
  log: "Setup Log Channel",
  anonymous: "Setup Anonymous Channel",
  qotd: "Setup Quote of the Day Channel",
};

export const SetupFields: Record<SetupType, FieldDescriptor[]> = {
  welcome: [
    {
      inputId: "welcome_channel",
      column: "welcome_channel",
      target: "guild",
      isSelect: true,
    },
    {
      inputId: "welcome_color",
      column: "welcome_color",
      target: "customize",
      isSelect: false,
    },
    {
      inputId: "welcome_message",
      column: "welcome_message",
      target: "customize",
      isSelect: false,
    },
    {
      inputId: "default_role",
      column: "default_role",
      target: "guild",
      isSelect: true,
    },
    {
      inputId: "greet_message",
      column: "greet_message",
      target: "customize",
      isSelect: false,
    },
  ],

  leave: [
    {
      inputId: "leave_channel",
      column: "leave_channel",
      target: "guild",
      isSelect: true,
    },
    {
      inputId: "leave_color",
      column: "leave_color",
      target: "customize",
      isSelect: false,  
    },
    {
      inputId: "leave_message",
      column: "leave_message",
      target: "customize",
      isSelect: false,
    },
  ],

  log: [
    {
      inputId: "log_channel",
      column: "log_channel",
      target: "guild",
      isSelect: true,
    },
  ],

  anonymous: [
    {
      inputId: "anonymous_channel",
      column: "anonymous_channel",
      target: "guild",
      isSelect: true,
    },
    {
      inputId: "anonymouslog_channel",
      column: "anonymouslog_channel",
      target: "guild",
      isSelect: true,
    },
  ],
  
  qotd: [
    {
      inputId: "qotd_channel",
      column: "qotd_channel",
      target: "guild",
      isSelect: true,
    },
  ],
};
