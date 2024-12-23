"use server";

import { PageContainer } from "@/components/page-container";
import ApiKeysForm from "@/components/settings/apiKeys";
import { getConfig } from "shared/src/server";

export default async function Page() {
  const config = await getConfig();
  return (
    <PageContainer title="API Keys">
      <ApiKeysForm config={config} />
    </PageContainer>
  );
}
