import { createReactBlockSpec, InlineContent } from "@blocknote/react";

export const DividerBlock = createReactBlockSpec({
  type: "divider",
  propSchema: {},
  containsInlineContent: false,
  render: () => <hr />,
});
