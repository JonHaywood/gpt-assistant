"use client";

import * as React from "react";
import {
  Bot,
  Home,
  RotateCcw,
  Power,
  Settings2,
  ScrollText,
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
      name: "Shutdown",
      onClick: () => {},
      icon: Power,
    },
    {
      name: "Restart",
      onClick: () => {},
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
          title: "General",
          url: "/settings",
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
