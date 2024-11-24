import LogsList from "@/components/logs-list";

export default function Page() {
  return (
    <div>
      <h1 className="font-semibold pb-2">Logs</h1>
      <LogsList url="/api/logs" />
    </div>
  );
}
