"use server";

import { PageContainer } from "@/components/page-container";
import AudioForm from "@/components/settings/audio";
import { getConfig } from "@/components/settings/config";

export default async function Page() {
  const config = await getConfig();
  return (
    <PageContainer title="Hardware Audio Settings">
      <AudioForm config={config} />
    </PageContainer>
  );
}
