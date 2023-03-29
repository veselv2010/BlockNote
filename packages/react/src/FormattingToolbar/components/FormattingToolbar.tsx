import { Block, PartialBlock } from "@blocknote/core";
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
import LinkToolbarButton from "./LinkToolbarButton";

export type FormattingToolbarProps = {
  boldIsActive: boolean;
  toggleBold: () => void;
  italicIsActive: boolean;
  toggleItalic: () => void;
  underlineIsActive: boolean;
  toggleUnderline: () => void;
  strikeIsActive: boolean;
  toggleStrike: () => void;
  hyperlinkIsActive: boolean;
  activeHyperlinkUrl: string;
  activeHyperlinkText: string;
  setHyperlink: (url: string, text?: string) => void;

  textColor: string;
  setTextColor: (color: string) => void;
  backgroundColor: string;
  setBackgroundColor: (color: string) => void;
  textAlignment: "left" | "center" | "right" | "justify";
  setTextAlignment: (
    textAlignment: "left" | "center" | "right" | "justify"
  ) => void;

  canIncreaseBlockIndent: boolean;
  increaseBlockIndent: () => void;
  canDecreaseBlockIndent: boolean;
  decreaseBlockIndent: () => void;

  block: Block;
  updateBlock: (updatedBlock: PartialBlock) => void;
};
type test = React.FC<FormattingToolbarProps>;
export const FormattingToolbar: test = (props: FormattingToolbarProps) => {
  return (
    <Toolbar>
      <ToolbarDropdown
        items={[
          {
            execute: () =>
              props.updateBlock({
                type: "paragraph",
                props: {},
              }),
            name: "Paragraph",
            icon: RiText,
            isSelected: props.block.type === "paragraph",
          },
          {
            execute: () =>
              props.updateBlock({
                type: "heading",
                props: { level: "1" },
              }),
            name: "Heading 1",
            icon: RiH1,
            isSelected:
              props.block.type === "heading" && props.block.props.level === "1",
          },
          {
            execute: () =>
              props.updateBlock({
                type: "heading",
                props: { level: "2" },
              }),
            name: "Heading 2",
            icon: RiH2,
            isSelected:
              props.block.type === "heading" && props.block.props.level === "2",
          },
          {
            execute: () =>
              props.updateBlock({
                type: "heading",
                props: { level: "3" },
              }),
            name: "Heading 3",
            icon: RiH3,
            isSelected:
              props.block.type === "heading" && props.block.props.level === "3",
          },
          {
            execute: () =>
              props.updateBlock({
                type: "bulletListItem",
                props: {},
              }),
            name: "Bullet List",
            icon: RiListUnordered,
            isSelected: props.block.type === "bulletListItem",
          },
          {
            execute: () =>
              props.updateBlock({
                type: "numberedListItem",
                props: {},
              }),
            name: "Numbered List",
            icon: RiListOrdered,
            isSelected: props.block.type === "numberedListItem",
          },
        ]}
      />
      <ToolbarButton
        execute={props.toggleBold}
        isSelected={props.boldIsActive}
        name="Bold"
        shortcut={formatKeyboardShortcut("Mod+B")}
        icon={RiBold}
      />
      <ToolbarButton
        execute={props.toggleItalic}
        isSelected={props.italicIsActive}
        name="Italic"
        shortcut={formatKeyboardShortcut("Mod+I")}
        icon={RiItalic}
      />
      <ToolbarButton
        execute={props.toggleUnderline}
        isSelected={props.underlineIsActive}
        name="Underline"
        shortcut={formatKeyboardShortcut("Mod+U")}
        icon={RiUnderline}
      />
      <ToolbarButton
        execute={props.toggleStrike}
        isSelected={props.strikeIsActive}
        name="Strikethrough"
        shortcut={formatKeyboardShortcut("Mod+Shift+X")}
        icon={RiStrikethrough}
      />

      <ToolbarButton
        execute={() => props.setTextAlignment("left")}
        isSelected={props.textAlignment === "left"}
        name={"Align Text Left"}
        icon={RiAlignLeft}
      />

      <ToolbarButton
        execute={() => props.setTextAlignment("center")}
        isSelected={props.textAlignment === "center"}
        name={"Align Text Center"}
        icon={RiAlignCenter}
      />

      <ToolbarButton
        execute={() => props.setTextAlignment("right")}
        isSelected={props.textAlignment === "right"}
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
                textColor={props.textColor}
                backgroundColor={props.backgroundColor}
                size={20}
              />
            )}
          />
        </Menu.Target>
        <Menu.Dropdown>
          <ColorPicker
            textColor={props.textColor}
            setTextColor={props.setTextColor}
            backgroundColor={props.backgroundColor}
            setBackgroundColor={props.setBackgroundColor}
          />
        </Menu.Dropdown>
      </Menu>

      <ToolbarButton
        execute={props.increaseBlockIndent}
        isDisabled={!props.canIncreaseBlockIndent}
        name="Indent"
        shortcut={formatKeyboardShortcut("Tab")}
        icon={RiIndentIncrease}
      />

      <ToolbarButton
        execute={props.decreaseBlockIndent}
        isDisabled={!props.canDecreaseBlockIndent}
        name="Decrease Indent"
        shortcut={formatKeyboardShortcut("Shift+Tab")}
        icon={RiIndentDecrease}
      />

      <LinkToolbarButton
        isSelected={props.hyperlinkIsActive}
        name="Link"
        execute={() => {
          return;
        }}
        shortcut={formatKeyboardShortcut("Mod+K")}
        icon={RiLink}
        hyperlinkIsActive={props.hyperlinkIsActive}
        activeHyperlinkUrl={props.activeHyperlinkUrl}
        activeHyperlinkText={props.activeHyperlinkText}
        setHyperlink={props.setHyperlink}
      />
    </Toolbar>
  );
};
