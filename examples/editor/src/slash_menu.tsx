import { BaseSlashMenuItem, Block, BlockNoteEditor, BlockSchema, DefaultBlockSchema, PartialBlock, defaultBlockSchema } from "@blocknote/core";
import {
    BlockNoteView,
    getDefaultReactSlashMenuItems,
    ReactSlashMenuItem,
    useBlockNote,
} from "@blocknote/react";
import "@blocknote/core/style.css";
import { HiOutlineGlobeAlt } from "react-icons/hi";
import {
    RiH1,
    RiH2,
    RiH3,
    RiListOrdered,
    RiListUnordered,
    RiText,
    RiImage2Fill,
    RiVideoAddFill,
} from "react-icons/ri";
import { blockSchema } from "./schema";

function insertOrUpdateBlock<BSchema extends BlockSchema>(
    editor: BlockNoteEditor<BSchema>,
    block: PartialBlock<BSchema>
) {
    const currentBlock = editor.getTextCursorPosition().block;
    if (
        (currentBlock.content.length === 1 &&
            currentBlock.content[0].type === "text" &&
            currentBlock.content[0].text === "/") ||
        currentBlock.content.length === 0
    ) {
        editor.updateBlock(currentBlock, block);
    } else {
        editor.insertBlocks([block], currentBlock, "after");
        editor.setTextCursorPosition(editor.getTextCursorPosition().nextBlock!);
    }
}

// Command to insert "Hello World" in bold in a new block below.
const insertDivider = (editor: BlockNoteEditor) => {
    // Block that the text cursor is currently in.
    const currentBlock: Block = editor.getTextCursorPosition().block;

    // New block we want to insert.
    const helloWorldBlock: PartialBlock = {
        type: "paragraph",
        content: [{ type: "text", text: "Hello World", styles: { bold: true } }],
    };

    // Inserting the new block after the current one.
    editor.insertBlocks([helloWorldBlock], currentBlock, "after");
};
// Custom Slash Menu item which executes the above function.
const insertHelloWorldItem: ReactSlashMenuItem = {
    name: "Вставить разделитель",
    execute: insertDivider,
    aliases: ["divider", "div"],
    group: "Other",
    icon: <HiOutlineGlobeAlt size={18} />,
    hint: "Используется для вставки разделительной линии.",
};


const getDefaultSlashMenuItems = <BSchema extends BlockSchema>(
    // This type casting is weird, but it's the best way of doing it, as it allows
    // the schema type to be automatically inferred if it is defined, or be
    // inferred as any if it is not defined. I don't think it's possible to make it
    // infer to DefaultBlockSchema if it is not defined.
    schema: BSchema = defaultBlockSchema as unknown as BSchema
) => {
    const slashMenuItems: BaseSlashMenuItem<BSchema>[] = [];

    if ("heading" in schema && "level" in schema.heading.propSchema) {
        // Command for creating a level 1 heading
        // if (schema.heading.propSchema.level.values?.includes("1")) {
        //     slashMenuItems.push({
        //         name: "Заголовок",
        //         aliases: ["h", "heading1", "h1"],
        //         execute: (editor) =>
        //             insertOrUpdateBlock(editor, {
        //                 type: "heading",
        //                 props: { level: "1" },
        //             } as PartialBlock<BSchema>),
        //     });
        // }

        // Command for creating a level 2 heading
        if (schema.heading.propSchema.level.values?.includes("2")) {
            slashMenuItems.push(
                {
                    name: "Подзаголовок",
                    aliases: ["h2", "heading2", "subheading"],
                    execute: (editor) =>
                        insertOrUpdateBlock(editor, {
                            type: "heading",
                            props: { level: "2" },
                        } as PartialBlock<BSchema>),
                });
        }

        // // Command for creating a level 3 heading
        // if (schema.heading.propSchema.level.values?.includes("3")) {
        //     slashMenuItems.push({
        //         name: "Heading 3",
        //         aliases: ["h3", "heading3", "subheading"],
        //         execute: (editor) =>
        //             insertOrUpdateBlock(editor, {
        //                 type: "heading",
        //                 props: { level: "3" },
        //             } as PartialBlock<BSchema>),
        //     });
        // }
    }

    if ("bulletListItem" in schema) {
        slashMenuItems.push({
            name: "Ненумерованный список",
            aliases: ["ul", "list", "bulletlist", "bullet list"],
            execute: (editor) =>
                insertOrUpdateBlock(editor, {
                    type: "bulletListItem",
                } as PartialBlock<BSchema>),
        });
    }

    if ("numberedListItem" in schema) {
        slashMenuItems.push({
            name: "Нумерованный список",
            aliases: ["li", "list", "numberedlist", "numbered list"],
            execute: (editor) =>
                insertOrUpdateBlock(editor, {
                    type: "numberedListItem",
                } as PartialBlock<BSchema>),
        });
    }

    if ("paragraph" in schema) {
        slashMenuItems.push({
            name: "Параграф",
            aliases: ["p"],
            execute: (editor) =>
                insertOrUpdateBlock(editor, {
                    type: "paragraph",
                } as PartialBlock<BSchema>),
        });
    }

    return slashMenuItems;
};

export const isAppleOS = () =>
    typeof navigator !== "undefined" &&
    (/Mac/.test(navigator.platform) ||
        (/AppleWebKit/.test(navigator.userAgent) &&
            /Mobile\/\w+/.test(navigator.userAgent)));

export function formatKeyboardShortcut(shortcut: string) {
    if (isAppleOS()) {
        return shortcut.replace("Mod", "⌘");
    } else {
        return shortcut.replace("Mod", "Ctrl");
    }
}


const extraFields: Record<
    string,
    Omit<
        ReactSlashMenuItem<DefaultBlockSchema>,
        keyof BaseSlashMenuItem<DefaultBlockSchema>
    >
> = {
    Заголовок: {
        group: "Заголовки",
        icon: <RiH1 size={18} />,
        hint: "Используется как главный заголовок",
        shortcut: formatKeyboardShortcut("Mod-Alt-1"),
    },
    "Подзаголовок": {
        group: "Заголовки",
        icon: <RiH2 size={18} />,
        hint: "Используется для глав внутри статьи",
        shortcut: formatKeyboardShortcut("Mod-Alt-2"),
    },
    "Heading 3": {
        group: "Заголовки",
        icon: <RiH3 size={18} />,
        hint: "Используется для подглав внутри статьи",
        shortcut: formatKeyboardShortcut("Mod-Alt-3"),
    },
    "Нумерованный список": {
        group: "Блоки",
        icon: <RiListOrdered size={18} />,
        hint: "Используется для создания нумерованного списка",
        shortcut: formatKeyboardShortcut("Mod-Alt-7"),
    },
    "Ненумерованный список": {
        group: "Блоки",
        icon: <RiListUnordered size={18} />,
        hint: "Используется для создания ненумерованного списка",
        shortcut: formatKeyboardShortcut("Mod-Alt-9"),
    },
    "Параграф": {
        group: "Блоки",
        icon: <RiText size={18} />,
        hint: "",
        shortcut: formatKeyboardShortcut("Mod-Alt-0"),
    },
};

const insertImageItem: ReactSlashMenuItem<typeof blockSchema> = {
    name: "Вставка изображения",
    execute: (editor) => {
        window.dispatchEvent(createCreationEvent('image'))
    },
    aliases: ["image", "img", "picture", "media"],
    group: "Медиа",
    icon: <RiImage2Fill />,
    hint: "",
};

function createCreationEvent(type:String) : CustomEvent {
    return new CustomEvent('post-editor', {detail: {'type': type, 'action': 'create'}})
}

const insertVideoItemCommand: ReactSlashMenuItem<typeof blockSchema> = {
    name: "Вставка видео",
    execute: (editor) => {
        window.dispatchEvent(createCreationEvent('video'))
    },
    aliases: ['video', 'видео'],
    group: "Медиа",
    icon: <RiVideoAddFill />,
    hint: "Загрузка видео из файлов на вашем устройстве",
};

export const customSlashMenuItemList = [
    ...getDefaultSlashMenuItems(defaultBlockSchema).map((item) => ({
        ...item,
        ...extraFields[item.name],
    })),
    insertHelloWorldItem,
    insertImageItem,
    insertVideoItemCommand,
];