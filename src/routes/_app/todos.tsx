import { createFileRoute } from "@tanstack/react-router";
import { ProjectsList } from "@/components/projects-list";

export const Route = createFileRoute("/_app/todos")({
  head: () => ({ meta: [{ title: "Todos — Cloud Code Vault" }] }),
  component: () => <ProjectsList title="Todos os projetos" />,
});
