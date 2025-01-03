"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FileUp, Save } from "lucide-react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BuiltinKeyword } from "./types";
import { useActionState, useRef } from "react";
import { onSubmitAction } from "@/app/settings/actions";
import { FormStateDisplay } from "../formStateDisplay";
import { Config, configSchema } from "shared";

export default function FormComponent({ config }: { config: Config }) {
  console.log("config", config);
  const [state, formAction] = useActionState(onSubmitAction, {
    success: false,
    message: "",
  });
  const form = useForm<z.infer<typeof configSchema>>({
    resolver: zodResolver(configSchema),
    // load existing values from config.json
    defaultValues: {
      ...config, // load existing values from config.json
      ...(state.fields ?? {}), // prevents values from being reset on error
    },
  });
  const formRef = useRef<HTMLFormElement>(null);

  const isAssistantNameCustom = form.watch("ASSISTANT_NAME_IS_CUSTOM");

  return (
    <Form {...form}>
      <form
        action={formAction}
        className="space-y-6 w-1/2 md:w-3/4"
        onSubmit={() => formRef.current?.submit()}
        ref={formRef}
      >
        <Card>
          <CardHeader>
            <CardDescription>
              <FormStateDisplay state={state} />
              Settings to customize the assistant&apos;s behavior. These
              settings are optional and can be left blank.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="OPENAI_MODEL"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>OpenAI Model</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Open AI Model" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="4o">GPT-4o</SelectItem>
                      <SelectItem value="4o-mini">GPT-4o Mini</SelectItem>
                      <SelectItem value="4o-turbo">GPT-4o Turbo</SelectItem>
                      <SelectItem value="4">GPT-4</SelectItem>
                      <SelectItem value="3.5-turbo">GPT-3.5 Turbo</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Set which OpenAI LLM model the assistant should use.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="ASSISTANT_NAME"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assistant Name</FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-[1fr_2fr] gap-2">
                      <div>
                        <Select
                          defaultValue={isAssistantNameCustom.toString()}
                          onValueChange={(value) =>
                            form.setValue(
                              "ASSISTANT_NAME_IS_CUSTOM",
                              value === "true"
                            )
                          }
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="true">Custom Name</SelectItem>
                            <SelectItem value="false">Built In Name</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        {isAssistantNameCustom ? (
                          <Input
                            placeholder="Assistant Name"
                            {...field}
                            className="w-full"
                          />
                        ) : (
                          <Select>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select an assistant name" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.values(BuiltinKeyword).map((keyword) => (
                                <SelectItem key={keyword} value={keyword}>
                                  {keyword}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </div>
                  </FormControl>
                  <FormDescription>
                    This is the name that the assistant will respond to. If you
                    select a custom name, you will need to provide a custom wake
                    word PPN file.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            {isAssistantNameCustom && (
              <FormField
                control={form.control}
                name="ASSISTANT_PPN_FILENAME"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assistant PPN Filename</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        <div className="text-sm text-gray-600 font-mono flex-1 border border-gray-300 rounded-md py-2 px-4">
                          {field.value
                            ? `/assets/${field.value}.ppn`
                            : "Select a PPN file"}
                        </div>
                        <Button
                          type="button"
                          variant="secondary"
                          className="text-xs hover:bg-gray-200"
                        >
                          <FileUp size={16} />
                          Upload New PPN File
                        </Button>
                      </div>
                    </FormControl>
                    <FormDescription>
                      This is the file name of the{" "}
                      <a
                        href="https://picovoice.ai/blog/console-tutorial-custom-wake-word/"
                        target="_blank"
                        className="underline text-blue-600"
                      >
                        custom wake word PPN file
                      </a>
                      . Upload a new PPN file to change the wake word. This can
                      be created using the&nbsp;
                      <a
                        href="https://console.picovoice.ai/"
                        target="_blank"
                        className="underline text-blue-600"
                      >
                        Picovoice Console
                      </a>
                      . The wake word is used to trigger the assistant to start
                      listening for requests.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="WAKEWORD_THRESHOLD"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Wake Word Threshold</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Wake Word Threshold"
                      type="number"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    The threshold for wake word detection. Defaults to 0.05,
                    valid values are between 0.0 and 1.0. Set lower if the
                    assistant is not detecting the wake word, set higher if the
                    assistant is detecting noise as the wake word.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="ASSISTANT_ONLY_SILENCE_TIMEOUT"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Wake Word Silence Timeout</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Wake Word Silence Timeout"
                      type="number"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    If the assistant has detected <em>no speech</em> after the
                    wake word, this is the time in seconds that the assistant
                    will wait before stopping listening. Tweak this if the you
                    want to allow a longer pause after the wake word. Defaults
                    to 5 seconds.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="ASSISTANT_POST_SPEECH_SILENCE_TIMEOUT"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Post Speech Silence Timeout</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Post Speech Silence Timeout"
                      type="number"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    <em>After speech has been detected</em>, this is the time in
                    seconds that the assistant will wait for silence before
                    transcribing. Tweak this if you want the assistant to act
                    faster or to wait longer after silence occurs. Defaults to
                    1.5 seconds.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="ASSISTANT_MAX_RECORDING_LENGTH"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Max Recording Length</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Max Recording Length"
                      type="number"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    The maximum time in seconds that the assistant will record
                    audio for. This is a safety measure to prevent the assistant
                    from recording indefinitely. Defaults to 15 seconds.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="ASSISTANT_VOICEDETECTION_THRESHOLD"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Voice Detection Threshold</FormLabel>
                  <FormControl>
                    <Input placeholder="Voice Detection Threshold" {...field} />
                  </FormControl>
                  <FormDescription>
                    The threshold for voice detection. Defaults to 0.05, valid
                    values are between 0.0 and 1.0. Set lower if the assistant
                    is not detecting speech, set higher if the assistant is
                    detecting noise as speech.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="ASK_HISTORY_SIZE"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Question & Answer Memory Size</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Question & Answer Memory Size"
                      type="number"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    The number of previous questions and answers to store in the
                    assistant memory. Defaults to 5, can go up to 100 but this
                    may cause errors if conversations exceed the LLM&apos;s
                    context window.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="LOG_LEVEL"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Log Level</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a Log Level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="trace">Trace</SelectItem>
                      <SelectItem value="debug">Debug</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="warn">Warn</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                      <SelectItem value="fatal">Fatal</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    The log level for the assistant. Defaults to
                    &quot;trace&quot;. Set to &quot;info&quot; to reduce log
                    output.
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
