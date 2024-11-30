import { ReactNode } from "react";

export function PageContainer({
  children,
  title,
}: {
  children: ReactNode;
  title?: string;
}) {
  return (
    <div className="flex flex-col flex-1 w-full">
      {title && <h1 className="font-semibold pb-2">{title}</h1>}
      <div className="w-full flex flex-1">{children}</div>
    </div>
  );
}
