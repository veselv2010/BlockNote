import {
    createReactBlockSpec,
    InlineContent,
} from "@blocknote/react";

export const VideoBlock = createReactBlockSpec({
    type: "video",
    propSchema: {
        src: {
            default: "https://via.placeholder.com/1000",
        },
    },
    containsInlineContent: true,
    render: ({ block }) => (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
            }}>
            <video
                style={{
                    width: "100%",
                }}
                src={block.props.src}
                contentEditable={false}
                controls>
                <source src='' type="type/mp4"></source>
            </video>
            <InlineContent />
        </div>
    ),
});