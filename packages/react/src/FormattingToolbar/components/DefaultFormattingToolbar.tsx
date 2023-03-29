import {
  BlockNoteEditor,
  getBlockInfoFromPos,
  PartialBlock,
} from "@blocknote/core";
import { Menu } from "@mantine/core";
import {
  RiAlignCenter,
  RiAlignLeft,
  RiAlignRight,
  RiBold,
  RiH1,
  RiH2,
  RiH3,
  RiIndentDecrease,
  RiIndentIncrease,
  RiItalic,
  RiLink,
  RiListOrdered,
  RiListUnordered,
  RiStrikethrough,
  RiText,
  RiUnderline,
} from "react-icons/ri";
import { ColorIcon } from "../../SharedComponents/ColorPicker/components/ColorIcon";
import { ColorPicker } from "../../SharedComponents/ColorPicker/components/ColorPicker";
import { Toolbar } from "../../SharedComponents/Toolbar/components/Toolbar";
import { ToolbarButton } from "../../SharedComponents/Toolbar/components/ToolbarButton";
import { ToolbarDropdown } from "../../SharedComponents/Toolbar/components/ToolbarDropdown";
import { formatKeyboardShortcut } from "../../utils";
import LinkToolbarButton from "../../FormattingToolbar/components/LinkToolbarButton";

export const DefaultFormattingToolbar = (props: {
  editor: BlockNoteEditor;
}) => {
  const block = props.editor.getTextCursorPosition().block;
  const toggleBold = () => {
    props.editor._tiptapEditor.view.focus();
    (props.editor._tiptapEditor.commands as any).toggleBold();
  };
  const toggleItalic = () => {
    props.editor._tiptapEditor.view.focus();
    (props.editor._tiptapEditor.commands as any).toggleItalic();
  };
  const toggleUnderline = () => {
    props.editor._tiptapEditor.view.focus();
    (props.editor._tiptapEditor.commands as any).toggleUnderline();
  };
  const toggleStrike = () => {
    props.editor._tiptapEditor.view.focus();
    (props.editor._tiptapEditor.commands as any).toggleStrike();
  };
  const setHyperlink = (url: string, text?: string) => {
    if (url === "") {
      return;
    }

    let { from, to } = props.editor._tiptapEditor.state.selection;

    if (!text) {
      text = props.editor._tiptapEditor.state.doc.textBetween(from, to);
    }

    const mark = props.editor._tiptapEditor.schema.mark("link", { href: url });

    props.editor._tiptapEditor.view.dispatch(
      props.editor._tiptapEditor.view.state.tr
        .insertText(text, from, to)
        .addMark(from, from + text.length, mark)
    );
    props.editor._tiptapEditor.view.focus();
  };
  const setTextColor = (color: string) => {
    props.editor._tiptapEditor.view.focus();
    (props.editor._tiptapEditor.commands as any).setTextColor(color);
  };

  const setBackgroundColor = (color: string) => {
    props.editor._tiptapEditor.view.focus();
    (props.editor._tiptapEditor.commands as any).setBackgroundColor(color);
  };
  const setTextAlignment = (
    textAlignment: "left" | "center" | "right" | "justify"
  ) => {
    props.editor._tiptapEditor.view.focus();
    (props.editor._tiptapEditor.commands as any).setTextAlignment(
      textAlignment
    );
  };
  const increaseBlockIndent = () => {
    props.editor._tiptapEditor.view.focus();
    props.editor._tiptapEditor.commands.sinkListItem("blockContainer");
  };
  const decreaseBlockIndent = () => {
    props.editor._tiptapEditor.view.focus();
    props.editor._tiptapEditor.commands.liftListItem("blockContainer");
  };
  // TODO: consider removing this method, and have clients use editor.updateBlock() instead
  const updateBlock = (updatedBlock: PartialBlock) => {
    props.editor._tiptapEditor.view.focus();
    (props.editor._tiptapEditor.commands as any).BNUpdateBlock(
      props.editor._tiptapEditor.state.selection.from,
      updatedBlock
    );
    // this.editor.updateBlock(updatedBlock.id!, updatedBlock);
  };

  // function getSelectionBoundingBox() {
  //   const { state } = props.editor._tiptapEditor.view;
  //   const { selection } = state;
  //
  //   // support for CellSelections
  //   const { ranges } = selection;
  //   const from = Math.min(...ranges.map((range) => range.$from.pos));
  //   const to = Math.max(...ranges.map((range) => range.$to.pos));
  //
  //   if (isNodeSelection(selection)) {
  //     const node = props.editor._tiptapEditor.view.nodeDOM(from) as HTMLElement;
  //
  //     if (node) {
  //       return node.getBoundingClientRect();
  //     }
  //   }
  //
  //   return posToDOMRect(props.editor._tiptapEditor.view, from, to);
  // }

  const blockInfo = getBlockInfoFromPos(
    props.editor._tiptapEditor.state.doc,
    props.editor._tiptapEditor.state.selection.from
  )!;

  const boldIsActive = props.editor._tiptapEditor.isActive("bold");
  const italicIsActive = props.editor._tiptapEditor.isActive("italic");
  const underlineIsActive = props.editor._tiptapEditor.isActive("underline");
  const strikeIsActive = props.editor._tiptapEditor.isActive("strike");
  const hyperlinkIsActive = props.editor._tiptapEditor.isActive("link");
  const activeHyperlinkUrl =
    props.editor._tiptapEditor.getAttributes("link").href || "";
  const activeHyperlinkText = props.editor._tiptapEditor.state.doc.textBetween(
    props.editor._tiptapEditor.state.selection.from,
    props.editor._tiptapEditor.state.selection.to
  );
  const textColor =
    props.editor._tiptapEditor.getAttributes("textColor").color || "default";
  const backgroundColor =
    props.editor._tiptapEditor.getAttributes("backgroundColor").color ||
    "default";
  const textAlignment =
    props.editor._tiptapEditor.getAttributes(blockInfo.contentType)
      .textAlignment || "left";
  const canIncreaseBlockIndent =
    props.editor._tiptapEditor.state.doc
      .resolve(blockInfo.startPos)
      .index(blockInfo.depth - 1) > 0;
  const canDecreaseBlockIndent = blockInfo.depth > 2;
  // const referenceRect = getSelectionBoundingBox();

  return (
    <Toolbar>
      <ToolbarDropdown
        items={[
          {
            execute: () =>
              updateBlock({
                type: "paragraph",
                props: {},
              }),
            name: "Paragraph",
            icon: RiText,
            isSelected: block.type === "paragraph",
          },
          {
            execute: () =>
              updateBlock({
                type: "heading",
                props: { level: "1" },
              }),
            name: "Heading 1",
            icon: RiH1,
            isSelected: block.type === "heading" && block.props.level === "1",
          },
          {
            execute: () =>
              updateBlock({
                type: "heading",
                props: { level: "2" },
              }),
            name: "Heading 2",
            icon: RiH2,
            isSelected: block.type === "heading" && block.props.level === "2",
          },
          {
            execute: () =>
              updateBlock({
                type: "heading",
                props: { level: "3" },
              }),
            name: "Heading 3",
            icon: RiH3,
            isSelected: block.type === "heading" && block.props.level === "3",
          },
          {
            execute: () =>
              updateBlock({
                type: "bulletListItem",
                props: {},
              }),
            name: "Bullet List",
            icon: RiListUnordered,
            isSelected: block.type === "bulletListItem",
          },
          {
            execute: () =>
              updateBlock({
                type: "numberedListItem",
                props: {},
              }),
            name: "Numbered List",
            icon: RiListOrdered,
            isSelected: block.type === "numberedListItem",
          },
        ]}
      />
      <ToolbarButton
        execute={toggleBold}
        isSelected={boldIsActive}
        name="Bold"
        shortcut={formatKeyboardShortcut("Mod+B")}
        icon={RiBold}
      />
      <ToolbarButton
        execute={toggleItalic}
        isSelected={italicIsActive}
        name="Italic"
        shortcut={formatKeyboardShortcut("Mod+I")}
        icon={RiItalic}
      />
      <ToolbarButton
        execute={toggleUnderline}
        isSelected={underlineIsActive}
        name="Underline"
        shortcut={formatKeyboardShortcut("Mod+U")}
        icon={RiUnderline}
      />
      <ToolbarButton
        execute={toggleStrike}
        isSelected={strikeIsActive}
        name="Strikethrough"
        shortcut={formatKeyboardShortcut("Mod+Shift+X")}
        icon={RiStrikethrough}
      />

      <ToolbarButton
        execute={() => setTextAlignment("left")}
        isSelected={textAlignment === "left"}
        name={"Align Text Left"}
        icon={RiAlignLeft}
      />

      <ToolbarButton
        execute={() => setTextAlignment("center")}
        isSelected={textAlignment === "center"}
        name={"Align Text Center"}
        icon={RiAlignCenter}
      />

      <ToolbarButton
        execute={() => setTextAlignment("right")}
        isSelected={textAlignment === "right"}
        name={"Align Text Right"}
        icon={RiAlignRight}
      />

      <Menu>
        <Menu.Target>
          <ToolbarButton
            name={"Colors"}
            execute={() => {
              return;
            }}
            icon={() => (
              <ColorIcon
                textColor={textColor}
                backgroundColor={backgroundColor}
                size={20}
              />
            )}
          />
        </Menu.Target>
        <Menu.Dropdown>
          <ColorPicker
            textColor={textColor}
            setTextColor={setTextColor}
            backgroundColor={backgroundColor}
            setBackgroundColor={setBackgroundColor}
          />
        </Menu.Dropdown>
      </Menu>

      <ToolbarButton
        execute={increaseBlockIndent}
        isDisabled={!canIncreaseBlockIndent}
        name="Indent"
        shortcut={formatKeyboardShortcut("Tab")}
        icon={RiIndentIncrease}
      />

      <ToolbarButton
        execute={decreaseBlockIndent}
        isDisabled={!canDecreaseBlockIndent}
        name="Decrease Indent"
        shortcut={formatKeyboardShortcut("Shift+Tab")}
        icon={RiIndentDecrease}
      />

      <LinkToolbarButton
        isSelected={hyperlinkIsActive}
        name="Link"
        execute={() => {
          return;
        }}
        shortcut={formatKeyboardShortcut("Mod+K")}
        icon={RiLink}
        hyperlinkIsActive={hyperlinkIsActive}
        activeHyperlinkUrl={activeHyperlinkUrl}
        activeHyperlinkText={activeHyperlinkText}
        setHyperlink={setHyperlink}
      />
    </Toolbar>
  );
};
