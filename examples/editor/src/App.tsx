// import logo from './logo.svg'
import "@blocknote/core/style.css";
import {
  BlockNoteView,
  FormattingToolbarPositioner,
  HyperlinkToolbarPositioner,
  SideMenuPositioner,
  SlashMenuPositioner,
  useBlockNote,
  Theme,
} from "@blocknote/react";
import styles from "./App.module.css";
import { customSlashMenuItemList } from "./slash_menu";
import { blockSchema } from "./schema";
import { insertImage, insertVideo } from "./custom_actions/insert_actions";


function App() {
  const editor = useBlockNote({
    onEditorContentChange: (editor) => {
      editor.blocksToMarkdown(editor.topLevelBlocks).then((e) => {
        console.log(e);
      });
    },
    domAttributes: {
      editor: {
        class: styles.editor,
        "data-test": "editor",
      },
    },
    blockSchema: blockSchema,
    slashMenuItems: customSlashMenuItemList,
  });

  // Give tests a way to get prosemirror instance
  (window as WindowWithProseMirror).ProseMirror = editor?._tiptapEditor;
  window.addEventListener("post-editor", (event) => {
    const castedEvent = event as CustomEvent

    if (castedEvent.detail.type == "video") {
      insertVideo(castedEvent.detail.url, editor)
    }

    if(castedEvent.detail.type == 'image'){
      insertImage(castedEvent.detail.url, editor)
    }
  });
  return (
    <BlockNoteView editor={editor}>
      <FormattingToolbarPositioner editor={editor} />
      <HyperlinkToolbarPositioner editor={editor} />
      <SlashMenuPositioner editor={editor} />
      <SideMenuPositioner editor={editor} />
    </BlockNoteView>
  );
}

export default App;
