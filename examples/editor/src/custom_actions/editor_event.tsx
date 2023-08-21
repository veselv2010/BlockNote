import { VideoBlock } from "../custom_blocks/video_block";

export type EditorEvent = {
  type: PostComponentType;
  action: PostEditorAction;
  details: any;
};

export const enum PostComponentType {
  video = "video",
  audio = "audio",
  image = "image",
  divider = "divider",
}

export const enum PostEditorAction {
  slashMenuCall = "slashMenuCall",
  create = "create",
}
