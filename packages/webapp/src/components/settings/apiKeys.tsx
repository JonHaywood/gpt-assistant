"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Save } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { onSubmitAction } from "@/app/settings/actions";
import { useActionState, useRef } from "react";
import { FormStateDisplay } from "../formStateDisplay";
import { Config, configSchema } from "shared";

export default function FormComponent({ config }: { config: Config }) {
  const [state, formAction] = useActionState(onSubmitAction, {
    success: false,
    message: "",
  });
  const form = useForm<z.infer<typeof configSchema>>({
    resolver: zodResolver(configSchema),
    defaultValues: {
      ...config, // load existing values from config.json
      ...(state.fields ?? {}), // prevents values from being reset on error
    },
  });
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <Form {...form}>
      <form
        action={formAction}
        className="space-y-6 w-1/2"
        onSubmit={() => formRef.current?.submit()}
        ref={formRef}
      >
        <Card>
          <CardHeader>
            <CardDescription>
              <FormStateDisplay state={state} />
              Keys for external services that the assistant uses. All keys are
              required.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="OPENAI_API_KEY"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>OpenAI API Key *</FormLabel>
                  <FormControl>
                    <Input placeholder="OpenAI API Key" {...field} />
                  </FormControl>
                  <FormDescription>
                    The OpenAI API key that&apos;s used to generate results for
                    the assistant.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="PICOVOICE_ACCESS_KEY"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>PicoVoice Access Key *</FormLabel>
                  <FormControl>
                    <Input placeholder="Picovoice Access Key" {...field} />
                  </FormControl>
                  <FormDescription>
                    Access Key obtained from&nbsp;
                    <a
                      href="https://console.picovoice.ai/"
                      target="_blank"
                      className="underline text-blue-600"
                    >
                      Picovoice Console
                    </a>
                    . Picovoice Porcupine and Cobra are used for wake word
                    detection and voice activity detection.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
        <Button type="submit">
          <Save /> Save settings
        </Button>
      </form>
    </Form>
  );
}
