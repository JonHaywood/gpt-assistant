"use client";

import * as React from "react";
import {
  Bot,
  Home,
  RotateCcw,
  Power,
  Settings2,
  ScrollText,
  Play,
} from "lucide-react";
import packageJson from "../../package.json";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { AdminActions } from "@/components/admin-actions";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { toast } from "@/hooks/use-toast";

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  app: {
    name: "GPT-Assistant",
    version: `v${packageJson.version}`,
    subTitle: "Admin",
    icon: Bot,
  },
  actions: [
    {
      name: "Start",
      onClick: async () => {
        toast({
          title: "Starting...",
          description: "Sending start command to the assistant",
        });

        const response = await fetch("/api/commands/start");
        const responseText = await response.text();

        toast({
          title: response.ok ? "Startup completed" : "Startup failed",
          description: responseText,
          variant: response.ok ? "default" : "destructive",
        });
      },
      icon: Play,
    },
    {
      name: "Shutdown",
      onClick: async () => {
        toast({
          title: "Shutting down...",
          description: "Sending shutdown command to the assistant",
        });

        const response = await fetch("/api/commands/stop");
        const responseText = await response.text();

        toast({
          title: response.ok ? "Shutdown completed" : "Shutdown failed",
          description: responseText,
          variant: response.ok ? "default" : "destructive",
        });
      },
      icon: Power,
    },
    {
      name: "Restart",
      onClick: async () => {
        toast({
          title: "Restarting...",
          description: "Sending restart command to the assistant",
        });

        const response = await fetch("/api/commands/restart");
        const responseText = await response.text();

        toast({
          title: response.ok ? "Restart completed" : "Restart failed",
          description: responseText,
          variant: response.ok ? "default" : "destructive",
        });
      },
      icon: RotateCcw,
    },
  ],
  navMain: [
    {
      title: "Home",
      url: "/",
      icon: Home,
      isActive: true,
      items: [],
    },
    {
      title: "Logs",
      url: "/logs",
      icon: ScrollText,
      items: [],
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings2,
      items: [
        {
          title: "API Keys",
          url: "/settings/api-keys",
        },
        {
          title: "Assistant",
          url: "/settings/assistant",
        },
        {
          title: "Audio",
          url: "/settings/audio",
        },
        {
          title: "Tools",
          url: "/settings/tools",
        },
      ],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <AdminActions app={data.app} actions={data.actions} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
