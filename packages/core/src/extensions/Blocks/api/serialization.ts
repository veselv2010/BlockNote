import { Extension } from "@tiptap/core";
import { DOMSerializer, Node } from "prosemirror-model";
import { Plugin } from "prosemirror-state";
import { BlockNoteEditor } from "../../..";

export const customBlockSerializer = (editor: BlockNoteEditor<any>) => {
  const defaultSerializer = DOMSerializer.fromSchema(
    editor._tiptapEditor.schema
  );

  const ret = new DOMSerializer(
    {
      ...defaultSerializer.nodes,
      // TODO: If a serializer is defined in the config for a custom block, it
      //  should be added here. We still need to figure out how the serializer
      //  should be defined in the custom blocks API though, and implement that,
      //  before we can do this.
    },
    defaultSerializer.marks
  );

  // This overrides serializeNodeInner from https://github.com/ProseMirror/prosemirror-model/blob/master/src/to_dom.ts
  // TODO: make this cleaner by just subclassing DOMSerializer and overriding
  const oldFunc = (ret as any).serializeNodeInner as Function;
  (ret as any).serializeNodeInner = function (
    node: Node,
    options: { document?: Document }
  ) {
    let e = editor;
    if (node.type.name === "blockContainer") {
      // TODO: here we can call custom serialization functions, instead of built-in ones
      console.log("serialize block", node);
      debugger;
    }
    const origValue = oldFunc.call(this, node, options);
    return origValue;
  };
  return ret;
};
export const CustomBlockSerializerExtension = Extension.create({
  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          clipboardSerializer: customBlockSerializer(this.editor.schema),
        },
      }),
    ];
  },
});
