export type ProjectStatus = "draft" | "active" | "archived";

export interface Project {
  id: string;
  ownerId: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentSection {
  id: string;
  projectId: string;
  name: string;
  slug: string;
  content: string;
  position: number;
  createdAt: string;
  updatedAt: string;
}
