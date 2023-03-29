import { Menu } from "@mantine/core";
import { IconType } from "react-icons";
import { TiTick } from "react-icons/ti";
import { MouseEvent } from "react";

export type ToolbarDropdownItemProps = {
  name: string;
  execute: (e: MouseEvent) => void;
  icon: IconType;
  isSelected?: boolean;
  isDisabled?: boolean;
  children?: any;
};

export function ToolbarDropdownItem(props: ToolbarDropdownItemProps) {
  const ItemIcon = props.icon;

  return (
    <Menu.Item
      key={props.name}
      onClick={props.execute}
      icon={ItemIcon && <ItemIcon size={16} />}
      rightSection={
        props.isSelected ? (
          <TiTick size={16} />
        ) : (
          // Ensures space for tick even if item isn't currently selected.
          <div style={{ width: "16px", padding: "0" }} />
        )
      }
      disabled={props.isDisabled}>
      {props.name}
    </Menu.Item>
  );
}
