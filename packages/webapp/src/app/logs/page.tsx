import LogsList from "@/components/logs-list";
import { PageContainer } from "@/components/page-container";

export default function Page() {
  return (
    <PageContainer title="Logs">
      <LogsList url="/api/logs" />
    </PageContainer>
  );
}
