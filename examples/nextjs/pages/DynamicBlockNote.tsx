import "@blocknote/core/style.css";
import { BlockNoteView, useBlockNote } from "@blocknote/react";

function Editor() {
  const editor = useBlockNote({});

  return <BlockNoteView editor={editor} />;
}

export default Editor;
