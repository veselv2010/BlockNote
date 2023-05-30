import { defaultBlockSchema, defaultSlashMenuItems } from "@blocknote/core";
import "@blocknote/core/style.css";
import { BlockNoteView, useBlockNote } from "@blocknote/react";
import React from "react";
import { insertAlert } from "../customblocks/Alert";
import { Button, insertButton } from "../customblocks/Button";
import { insertEmbed } from "../customblocks/Embed";
import { insertImage } from "../customblocks/Image";
import { insertSeparator } from "../customblocks/Separator";
import { insertTableOfContents } from "../customblocks/TableOfContents";
import styles from "./Editor.module.css";

type WindowWithProseMirror = Window & typeof globalThis & { ProseMirror: any };

type Config = {
  [key: string]: string;
};

type PrimaryConfig = {
  primary: string;
};

function menu(config: { example: number }) {}

function menu2(config: { example2: number }) {}

type Item<T extends Schema> = {
  name: string;
  command: (editor: T) => void;
};

class TEditor<T extends Schema> {
  public readonly schema: T;
}
class ItemClass<T extends Schema> {
  constructor(
    public name: string,
    public readonly command: (editor: TEditor<T>) => void
  ) {}
}

type Options<T extends Schema> = {
  // items: Item<T>[];
  items: ItemClass<T>[];
  other: T;
};

function create<T extends Schema>(options: Options<T>) {
  return {} as T;
}

type Schema = {
  [key: string]: { type: string };
};

let SchemaX = {
  x: { type: "x" } as const,
};

let SchemaY = {
  y: { type: "y" } as const,
};

const item = {
  name: "test",
  command: (editor: typeof SchemaX) => {},
};

type combined = typeof SchemaX & typeof SchemaY;
const itemObj = new ItemClass<typeof SchemaX>("test", (editor) => {});
const itemObj2 = new ItemClass<combined>("test", (editor) => {});

const items = [itemObj];

let x = create({
  items: items,
  other: {
    ...SchemaX,
    ...SchemaY,
  },
});

export default function Editor() {
  const blockSchema = {
    ...defaultBlockSchema,
    // alesrt: Alert,
    button: Button,
    // embed: Embed,
    // image: Image,
    // separator: Separator,
    // toc: TableOfContents,
  } as const;

  const slashCommands = [
    insertAlert,
    insertButton,
    insertEmbed,
    insertImage,
    insertSeparator,
    insertTableOfContents,
  ];

  // let x = [
  //   ...defaultReactSlashMenuItems,
  //   ...slashCommands,
  // ] as const;

  const editor = useBlockNote<typeof blockSchema>({
    editorDOMAttributes: {
      class: styles.editor,
      "data-test": "editor",
    },
    blockSchema: blockSchema,
    slashCommands: defaultSlashMenuItems,
  });

  console.log(editor);

  // Give tests a way to get prosemirror instance
  (window as WindowWithProseMirror).ProseMirror = editor?._tiptapEditor;

  return <BlockNoteView editor={editor} />;
}
