import {
  FormattingToolbarDynamicParams,
  FormattingToolbarStaticParams,
} from "@blocknote/core";

export const CustomFormattingToolbar = (
  props: FormattingToolbarStaticParams & FormattingToolbarDynamicParams
) => {
  const Component = props.items;

  return <Component {...props} />;
};
