import { AlertCircle, Check } from "lucide-react";

import { FormState } from "@/app/settings/formSubmit";
import { cn } from "@/lib/utils";

export const FormStateDisplay = ({
  state: { success, message },
}: {
  state: FormState;
}) => {
  if (!message) return null;
  return (
    <div
      className={cn(
        "mb-4 px-4 py-1 border",
        success
          ? "bg-green-100 text-green-600 border-green-300"
          : "bg-red-100 text-red-600 border-red-300"
      )}
    >
      {success ? (
        <Check className="w-4 h-4 inline-block mr-1" />
      ) : (
        <AlertCircle className="w-4 h-4 inline-block mr-1" />
      )}
      {message}
    </div>
  );
};
