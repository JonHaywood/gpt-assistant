import LogsList from "@/components/logs-list";

export default function Page() {
  const url = "ws://10.0.33.206:8800";

  return (
    <div>
      <h1 className="font-semibold pb-2">Logs</h1>
      <LogsList url={url} />
    </div>
  );
}
