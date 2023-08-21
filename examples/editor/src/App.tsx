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
import {
  EditorEvent,
  PostComponentType,
  PostEditorAction,
} from "./custom_actions/editor_event";
import { insertVideo } from "./custom_actions/insert_actions";
import { ImageBlock } from "./custom_blocks/image_block";
import {
  BlockIdentifier,
  BlockSchema,
  BlockSpec,
  PropSchema,
} from "@blocknote/core";
import { VideoBlock } from "./custom_blocks/video_block";
import { DividerBlock } from "./custom_blocks/divider_block";

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
    // enableBlockNoteExtensions: true,
    slashMenuItems: customSlashMenuItemList,
  });

  type BlocksInSchema<TSchema extends BlockSchema> = TSchema[keyof TSchema];

  function insertBlock<
    TBlock extends BlocksInSchema<typeof blockSchema>,
    TProps extends PropSchema
  >(
    block: TBlock,
    props: TProps,
    referenceBlock: BlockIdentifier = editor.getTextCursorPosition().block,
    placement: "before" | "after" | "nested" = "after"
  ) {
    editor.insertBlocks(
      [
        {
          type: block.node.name,
          props,
        },
      ],
      referenceBlock,
      placement
    );
  }

  const postComponentTypeToBlock = {
    [PostComponentType.video]: VideoBlock,
    [PostComponentType.audio]: VideoBlock,
    [PostComponentType.image]: ImageBlock,
    [PostComponentType.divider]: DividerBlock,
  } as const;

  (window as WindowWithProseMirror).ProseMirror = editor?._tiptapEditor;
  window.addEventListener("post-editor", (event) => {
    const eventDetail = (event as CustomEvent).detail as EditorEvent;

    if (
      (window as any).flutterCanvasKit &&
      eventDetail.action != PostEditorAction.create
    )
      return;
    console.log(eventDetail);

    insertBlock(
      postComponentTypeToBlock[eventDetail.type],
      eventDetail.details
    );
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
