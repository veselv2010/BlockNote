import { BlockSchema, defaultBlockSchema } from "@blocknote/core";
import { ImageBlock } from "./custom_blocks/image_block";
import { VideoBlock } from "./custom_blocks/video_block";

export const blockSchema = {
    ...defaultBlockSchema,
    image: ImageBlock,
    video: VideoBlock,
} satisfies BlockSchema