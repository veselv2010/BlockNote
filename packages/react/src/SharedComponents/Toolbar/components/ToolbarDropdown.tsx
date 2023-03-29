import { Menu } from "@mantine/core";
import {
  ToolbarDropdownItem,
  ToolbarDropdownItemProps,
} from "./ToolbarDropdownItem";
import { ToolbarDropdownTarget } from "./ToolbarDropdownTarget";

export type ToolbarDropdownProps = {
  items: ToolbarDropdownItemProps[];
  children?: any;
  isDisabled?: boolean;
};

export function ToolbarDropdown(props: ToolbarDropdownProps) {
  const activeItem = props.items.filter((p) => p.isSelected)[0];

  return (
    <Menu exitTransitionDuration={0}>
      <Menu.Target>
        <ToolbarDropdownTarget {...activeItem} />
      </Menu.Target>
      <Menu.Dropdown>
        {props.items.map((item) => (
          <ToolbarDropdownItem key={item.name} {...item} />
        ))}
      </Menu.Dropdown>
    </Menu>
  );
}
