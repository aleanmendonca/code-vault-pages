import { createFileRoute } from "@tanstack/react-router";
import { ProjectsList } from "@/components/projects-list";

export const Route = createFileRoute("/_app/saas")({
  head: () => ({ meta: [{ title: "SaaS — CodeVault" }] }),
  component: () => <ProjectsList type="saas" title="SaaS" />,
});
