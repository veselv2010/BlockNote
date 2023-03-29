import { ActionIcon, Button } from "@mantine/core";
import Tippy from "@tippyjs/react";
import { ForwardedRef, forwardRef, MouseEvent } from "react";
import { TooltipContent } from "../../Tooltip/components/TooltipContent";
import { IconType } from "react-icons";

export type ToolbarButtonProps = {
  name: string;
  execute: (e: MouseEvent) => void;
  icon: IconType;
  shortcut?: string;
  isSelected?: boolean;
  isDisabled?: boolean;
  children?: any;
};

/**
 * Helper for basic buttons that show in the formatting toolbar.
 */
export const ToolbarButton = forwardRef(
  (props: ToolbarButtonProps, ref: ForwardedRef<HTMLButtonElement>) => {
    const ButtonIcon = props.icon;
    return (
      <Tippy
        content={
          <TooltipContent
            mainTooltip={props.name}
            secondaryTooltip={props.shortcut}
          />
        }
        trigger={"mouseenter"}>
        {/*Creates an ActionIcon instead of a Button if only an icon is provided as content.*/}
        {props.children ? (
          <Button
            onClick={props.execute}
            color={"brandFinal"}
            data-test={
              props.name.slice(0, 1).toLowerCase() +
              props.name.replace(/\s+/g, "").slice(1)
            }
            size={"xs"}
            variant={props.isSelected ? "filled" : "subtle"}
            disabled={props.isDisabled || false}
            ref={ref}>
            {ButtonIcon && <ButtonIcon />}
            {props.children}
          </Button>
        ) : (
          <ActionIcon
            onClick={props.execute}
            color={"brandFinal"}
            data-test={
              props.name.slice(0, 1).toLowerCase() +
              props.name.replace(/\s+/g, "").slice(1)
            }
            size={30}
            variant={props.isSelected ? "filled" : "subtle"}
            disabled={props.isDisabled || false}
            ref={ref}>
            {ButtonIcon && <ButtonIcon />}
          </ActionIcon>
        )}
      </Tippy>
    );
  }
);
