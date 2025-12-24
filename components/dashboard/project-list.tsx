"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { FolderGit2 } from "lucide-react"
import { ProjectListItem, ProjectStatistics } from "./project-list-item"

interface ProjectListProps {
  projects: ProjectStatistics[];
  apiKey: string;
}

export function ProjectList({ projects: initialProjects, apiKey }: ProjectListProps) {
  const [projects, setProjects] = useState<ProjectStatistics[]>(initialProjects);

  const handleDeleteProject = (projectId: number) => {
    setProjects(prev => prev.filter(p => p.repo_id !== projectId));
  };

  if (!projects || projects.length === 0) {
    return (
      <Card className="border-border/50 bg-card/50">
        <CardContent className="py-12 text-center">
          <FolderGit2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">아직 프로젝트가 없습니다.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">프로젝트</h2>
        <p className="text-sm text-muted-foreground">총 {projects.length}개</p>
      </div>

      <div className="space-y-3">
        {projects.map((project) => (
          <ProjectListItem
            key={project.repo_id}
            project={project}
            apiKey={apiKey}
            onDelete={handleDeleteProject}
          />
        ))}
      </div>
    </div>
  );
}
