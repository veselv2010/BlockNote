import {
  FormattingToolbar,
  FormattingToolbarFactory,
  FormattingToolbarStaticParams,
  FormattingToolbarDynamicParams,
} from "@blocknote/core";
import { FormattingToolbar as ReactFormattingToolbar } from "./components/FormattingToolbar";
import { ReactElementFactory } from "../ElementFactory/components/ReactElementFactory";

export const ReactFormattingToolbarFactory: FormattingToolbarFactory = (
  items: JSX.Element,
  staticParams
): FormattingToolbar => {
  return ReactElementFactory<
    FormattingToolbarStaticParams,
    FormattingToolbarDynamicParams
  >(staticParams, items ? items : ReactFormattingToolbar, {
    animation: "fade",
    placement: "top-start",
  });
};
