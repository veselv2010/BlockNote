import { BlockNoteEditor } from "@blocknote/core";
import { blockSchema } from "../schema";

export function insertVideo(url: string, editor: BlockNoteEditor<typeof blockSchema>) {
  editor.insertBlocks(
    [
      {
        type: "video",
        props: {
          src: url || "https://via.placeholder.com/1000",
        },
      },
    ],
    editor.getTextCursorPosition().block,
    "after"
  );
}

export function insertImage(url: string, editor: BlockNoteEditor<typeof blockSchema>) {
  editor.insertBlocks(
    [
      {
        type: "image",
        props: {
          src: url || "https://via.placeholder.com/1000",
        },
      },
    ],
    editor.getTextCursorPosition().block,
    "after"
  );
}
