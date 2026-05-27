import { createFileRoute } from "@tanstack/react-router";
import { ProjectsList } from "@/components/projects-list";

export const Route = createFileRoute("/_app/ia")({
  head: () => ({ meta: [{ title: "IA — Cloud Code Vault" }] }),
  component: () => <ProjectsList type="ia" title="IA" />,
});
