import { createFileRoute } from "@tanstack/react-router";
import { ProjectsList } from "@/components/projects-list";

export const Route = createFileRoute("/_app/saas")({
  head: () => ({ meta: [{ title: "SaaS — Cloud Code Vault" }] }),
  component: () => <ProjectsList type="saas" title="SaaS" />,
});
