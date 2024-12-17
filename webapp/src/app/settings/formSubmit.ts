"use server";

import { formSchema } from "@/components/settings/schema";

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
  const parsed = formSchema.safeParse(formData);

  // validate input
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const key of Object.keys(formData)) {
      fields[key] = formData[key].toString();
    }
    return {
      success: false,
      message: parsed.error.message,
      fields,
    };
  }

  // TODO: save to config.json file
  console.log("!!! Saving to config.json", parsed.data);

  return {
    success: true,
    message: "Form submitted successfully",
  };
}
