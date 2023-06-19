import { DOMParser, Schema } from "prosemirror-model";
import rehypeParse from "rehype-parse";
import rehypeRemark from "rehype-remark";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import remarkStringify from "remark-stringify";
import { unified } from "unified";
import { BlockNoteEditor } from "../..";
import { Block, BlockSchema } from "../../extensions/Blocks/api/blockTypes";
import { customBlockSerializer } from "../../extensions/Blocks/api/serialization";

import { blockToNode, nodeToBlock } from "../nodeConversions/nodeConversions";
import { removeUnderlines } from "./removeUnderlinesRehypePlugin";
import { simplifyBlocks } from "./simplifyBlocksRehypePlugin";

export async function blocksToHTML<BSchema extends BlockSchema>(
  blocks: Block<BSchema>[],
  editor: BlockNoteEditor<BSchema>
): Promise<string> {
  const htmlParentElement = document.createElement("div");
  const serializer = customBlockSerializer(editor);

  for (const block of blocks) {
    // TODO: we could also directly call the required function on "block" here?
    const node = blockToNode(block, editor._tiptapEditor.schema);
    const htmlNode = serializer.serializeNode(node);
    htmlParentElement.appendChild(htmlNode);
  }

  const htmlString = await unified()
    .use(rehypeParse, { fragment: true })
    .use(simplifyBlocks, {
      orderedListItemBlockTypes: new Set<string>(["numberedListItem"]),
      unorderedListItemBlockTypes: new Set<string>(["bulletListItem"]),
    })
    .use(rehypeStringify)
    .process(htmlParentElement.innerHTML);

  return htmlString.value as string;
}

export async function HTMLToBlocks<BSchema extends BlockSchema>(
  html: string,
  blockSchema: BSchema,
  schema: Schema
): Promise<Block<BSchema>[]> {
  const htmlNode = document.createElement("div");
  htmlNode.innerHTML = html.trim();

  const parser = DOMParser.fromSchema(schema);
  const parentNode = parser.parse(htmlNode);

  const blocks: Block<BSchema>[] = [];

  for (let i = 0; i < parentNode.firstChild!.childCount; i++) {
    blocks.push(nodeToBlock(parentNode.firstChild!.child(i), blockSchema));
  }

  return blocks;
}

export async function blocksToMarkdown<BSchema extends BlockSchema>(
  blocks: Block<BSchema>[],
  schema: Schema
): Promise<string> {
  const markdownString = await unified()
    .use(rehypeParse, { fragment: true })
    .use(removeUnderlines)
    .use(rehypeRemark)
    .use(remarkGfm)
    .use(remarkStringify)
    .process(await blocksToHTML(blocks, schema));

  return markdownString.value as string;
}

export async function markdownToBlocks<BSchema extends BlockSchema>(
  markdown: string,
  blockSchema: BSchema,
  schema: Schema
): Promise<Block<BSchema>[]> {
  const htmlString = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeStringify)
    .process(markdown);

  return HTMLToBlocks(htmlString.value as string, blockSchema, schema);
}
