// import logo from './logo.svg'
import "@blocknote/core/style.css";
import { BlockNoteView, FormattingToolbarPositioner, HyperlinkToolbarPositioner, SideMenuPositioner, SlashMenuPositioner, useBlockNote } from "@blocknote/react";
import styles from "./App.module.css";
import { customSlashMenuItemList } from "./slash_menu";
import { blockSchema } from "./schema";

function App() {
  // const postEditorEl = document.getElementById('post-editor')!;

  const editor = useBlockNote({
    onEditorContentChange: (editor) => {
      editor.blocksToMarkdown(editor.topLevelBlocks).then((e) => {
        console.log(e);
      });
    },
    editorDOMAttributes: {
      class: styles.editor,
      "data-test": "editor",
    },
    theme: "light",
    blockSchema: blockSchema,
    slashMenuItems: customSlashMenuItemList,
  });

  // Give tests a way to get prosemirror instance
  (window as WindowWithProseMirror).ProseMirror = editor?._tiptapEditor;

  return <BlockNoteView editor={editor}>
    <FormattingToolbarPositioner editor={editor} />
    <HyperlinkToolbarPositioner editor={editor} />
    <SlashMenuPositioner editor={editor} />
    <SideMenuPositioner editor={editor} />
  </BlockNoteView>;
}



export default App;
