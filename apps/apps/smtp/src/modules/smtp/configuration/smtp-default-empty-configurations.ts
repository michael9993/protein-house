import { messageEventTypes } from "../../event-handlers/message-event-types";
import { getDefaultTemplates } from "../default-templates";
import {
  SmtpConfiguration,
  TemplateLanguage,
  smtpConfigurationEventSchema,
  smtpConfigurationSchema,
} from "./smtp-config-schema";

const eventsConfiguration = (language: TemplateLanguage = "en"): SmtpConfiguration["events"] => {
  const { templates, subjects } = getDefaultTemplates(language);

  return messageEventTypes.map((eventType) =>
    smtpConfigurationEventSchema.parse({
      eventType: eventType,
      template: templates[eventType],
      subject: subjects[eventType],
    }),
  );
};

const configuration = (language: TemplateLanguage = "en"): SmtpConfiguration => {
  const defaultConfig: SmtpConfiguration = smtpConfigurationSchema.parse({
    id: "id",
    name: "name",
    active: true,
    smtpHost: "host",
    smtpPort: "1024",
    templateLanguage: language,
    channels: {
      excludedFrom: [],
      restrictedTo: [],
    },
    events: eventsConfiguration(language),
  });

  return defaultConfig;
};

export const smtpDefaultEmptyConfigurations = {
  eventsConfiguration,
  configuration,
};
