import { createFileRoute } from "@tanstack/react-router";
import { ProjectsList } from "@/components/projects-list";

export const Route = createFileRoute("/_app/n8n")({
  head: () => ({ meta: [{ title: "N8N — Cloud Code Vault" }] }),
  component: () => <ProjectsList type="n8n" title="N8N" />,
});
