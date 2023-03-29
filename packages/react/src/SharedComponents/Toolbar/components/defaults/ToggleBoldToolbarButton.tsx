import { formatKeyboardShortcut } from "../../../../utils";
import { RiBold } from "react-icons/ri";
import { ToolbarButton } from "../ToolbarButton";
import { BlockNoteEditor } from "@blocknote/core";

export const ToggleBoldToolbarButton = (editor: BlockNoteEditor) => {
  return (
    <ToolbarButton
      execute={() => {
        editor._tiptapEditor.view.focus();
        // @ts-ignore
        editor._tiptapEditor.commands.toggleBold();
      }}
      isSelected={editor._tiptapEditor.isActive("bold")}
      name="Bold"
      shortcut={formatKeyboardShortcut("Mod+B")}
      icon={RiBold}
    />
  );
};
