import { createReactBlockSpec, InlineContent } from "@blocknote/react";

export const DividerBlock = createReactBlockSpec({
  type: "divider",
  propSchema: {},
  containsInlineContent: true,
  render: () => <hr />,
});
