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
import { Config } from "./config";
import { formSchema } from "./schema";
import { useActionState, useRef } from "react";
import { onSubmitAction } from "@/app/settings/formSubmit";
import { FormStateDisplay } from "../formStateDisplay";

export default function FormComponent({ config }: { config: Config }) {
  const [state, formAction] = useActionState(onSubmitAction, {
    success: false,
    message: "",
  });
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    // load existing values from config.json
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
              Settings for the hardware device that control audio. These
              settings are optional and can be left blank.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="DEVICE_INDEX"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Microphone Device Index</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Microphone Device Index"
                      type="number"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    This is typically in the range of 0-5, depending on where
                    the mirrophone is plugged in. Defaults to 2.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="VOLUME_CONTROL_DEVICE"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Volume Control Device</FormLabel>
                  <FormControl>
                    <Input placeholder="Volume Control Device" {...field} />
                  </FormControl>
                  <FormDescription>
                    The default is &quot;PCM&quot;. Set this if this is not the
                    case for your set up.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="VOLUME_CONTROL_DEVICE_INDEX"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Volume Control Device Index</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Volume Control Device Index"
                      type="number"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    This is typically in the range of 0-5, depending on where
                    the audio device is plugged in. Defaults to 1.
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
