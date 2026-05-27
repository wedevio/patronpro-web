export type BlockType = "heading" | "text" | "image" | "video" | "callout";

export interface HeadingBlockData {
  level: 2 | 3;
  text: string;
}

export interface TextBlockData {
  /** Plain text with \n line breaks. May contain markdown-style **bold** or _italic_. */
  content: string;
}

export interface ImageBlockData {
  url: string;
  alt: string;
  caption?: string;
}

export interface VideoBlockData {
  url: string;
  caption?: string;
}

export type CalloutVariant = "info" | "warning" | "success" | "accent" | "pending";

export interface CalloutBlockData {
  variant: CalloutVariant;
  title?: string;
  content: string;
}

export type BlockData =
  | HeadingBlockData
  | TextBlockData
  | ImageBlockData
  | VideoBlockData
  | CalloutBlockData;

export interface DocBlock {
  id: string;
  type: BlockType;
  data: BlockData;
}

export interface DocPage {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  position: number;
  published: boolean;
  blocks: DocBlock[];
  created_at: string;
  updated_at: string;
  updated_by: string | null;
}
