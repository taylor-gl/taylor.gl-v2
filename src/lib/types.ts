export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  tags: string[];
  preview: string;
  content: string;
  starred?: boolean;
}

export type MadLibPick = number;
