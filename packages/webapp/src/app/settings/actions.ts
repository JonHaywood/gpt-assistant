"use server";

import { configSchema } from "shared";
import { getConfig, saveConfig } from "shared/src/server";

export interface FormState {
  success: boolean;
  message: string;
  fields?: Record<string, string>;
}

export async function onSubmitAction(
  prevState: FormState,
  data: FormData
): Promise<FormState> {
  // convert into normal object
  const formData = Object.fromEntries(data);

  // make all fields optional and only validate the ones that are present
  const partialSchema = configSchema.partial();
  const parsed = partialSchema.safeParse(formData);

  // validate input
  if (!parsed.success) {
    // send back fields so form remains populated
    const fields: Record<string, string> = {};
    for (const key of Object.keys(formData)) {
      fields[key] = formData[key].toString();
    }
    // user friend error message
    const message =
      "Fix the following issues:\n" +
      parsed.error.issues
        .map((issue) => {
          return `${issue.path.join(".")} ${issue.message}`;
        })
        .join("\n");
    return {
      success: false,
      message,
      fields,
    };
  }

  // save to config.json file, overwriting existing values
  const existingConfig = await getConfig();

  const newConfig = { ...existingConfig, ...parsed.data };
  await saveConfig(newConfig);

  return {
    success: true,
    message: "Form submitted successfully",
  };
}
