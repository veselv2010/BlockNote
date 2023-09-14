import { createReactBlockSpec, InlineContent } from "@blocknote/react";

export const ImageBlock = createReactBlockSpec({
  type: "image",
  propSchema: {
    src: {
      default: "https://via.placeholder.com/1000",
    },
    fileId: {
      default: "",
    },
  },
  containsInlineContent: true,
  render: ({ block }) => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
      }}>
      <img
        style={{
          width: "100%",
        }}
        src={block.props.src}
        alt={"Image"}
        contentEditable={false}
      />
      <InlineContent />
    </div>
  ),
});
