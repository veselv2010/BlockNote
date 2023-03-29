import { useState } from "react";
import { EditHyperlinkMenu } from "../EditHyperlinkMenu/components/EditHyperlinkMenu";
import { Toolbar } from "../../SharedComponents/Toolbar/components/Toolbar";
import { ToolbarButton } from "../../SharedComponents/Toolbar/components/ToolbarButton";
import { RiExternalLinkFill, RiLinkUnlink } from "react-icons/ri";
// import rootStyles from "../../../root.module.css";

export type HyperlinkToolbarProps = {
  url: string;
  text: string;
  editHyperlink: (url: string, text: string) => void;
  deleteHyperlink: () => void;
};

/**
 * Main menu component for the hyperlink extension.
 * Renders a toolbar that appears on hyperlink hover.
 */
export const HyperlinkToolbar = (props: HyperlinkToolbarProps) => {
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return (
      <EditHyperlinkMenu
        url={props.url}
        text={props.text}
        update={props.editHyperlink}
      />
    );
  }

  return (
    <Toolbar>
      <ToolbarButton
        name="Edit"
        isSelected={false}
        icon={RiExternalLinkFill}
        execute={() => setIsEditing(true)}>
        Edit Link
      </ToolbarButton>
      <ToolbarButton
        name="Open in new tab"
        isSelected={false}
        execute={() => {
          window.open(props.url, "_blank");
        }}
        icon={RiExternalLinkFill}
      />
      <ToolbarButton
        name="Remove link"
        isSelected={false}
        execute={props.deleteHyperlink}
        icon={RiLinkUnlink}
      />
    </Toolbar>
  );
};
