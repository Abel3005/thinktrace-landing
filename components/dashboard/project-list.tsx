import { Card, CardContent } from "@/components/ui/card"
import { FolderGit2 } from "lucide-react"
import { ProjectListItem, ProjectStatistics } from "./project-list-item"
import { AddProjectDialog } from "./add-project-dialog"

interface ProjectListProps {
  projects: ProjectStatistics[];
  userId: string;
}

export function ProjectList({ projects, userId }: ProjectListProps) {
  if (!projects || projects.length === 0) {
    return (
      <Card className="border-border/50 bg-card/50">
        <CardContent className="py-12 text-center">
          <FolderGit2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">아직 프로젝트가 없습니다.</p>
          <AddProjectDialog userId={userId} />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">프로젝트</h2>
        <div className="flex items-center gap-4">
          <p className="text-sm text-muted-foreground">총 {projects.length}개</p>
          <AddProjectDialog userId={userId} />
        </div>
      </div>

      <div className="space-y-3">
        {projects.map((project) => (
          <ProjectListItem key={project.repo_id} project={project} />
        ))}
      </div>
    </div>
  );
}
