"use server";

import { PageContainer } from "@/components/page-container";
import AssistantForm from "@/components/settings/assistant";
import { getConfig } from "shared/src/server";

export default async function Page() {
  const config = await getConfig();
  return (
    <PageContainer title="Assistant Settings">
      <AssistantForm config={config} />
    </PageContainer>
  );
}
