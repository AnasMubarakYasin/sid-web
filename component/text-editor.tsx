"use client";

import { useCallback, useLayoutEffect, useState } from "react";

import { RichTextProvider } from "reactjs-tiptap-editor";

// Base Kit
import { Document } from "@tiptap/extension-document";
import { HardBreak } from "@tiptap/extension-hard-break";
import { ListItem } from "@tiptap/extension-list";
import { Paragraph } from "@tiptap/extension-paragraph";
import { Text } from "@tiptap/extension-text";
import { TextStyle } from "@tiptap/extension-text-style";
import {
  Dropcursor,
  Gapcursor,
  Placeholder,
  TrailingNode,
  Selection,
} from "@tiptap/extensions";
import StarterKit from "@tiptap/starter-kit";
import { Editor, EditorContent, useEditor } from "@tiptap/react";
import {
  Attachment,
  RichTextAttachment,
} from "reactjs-tiptap-editor/attachment";
import {
  Blockquote,
  RichTextBlockquote,
} from "reactjs-tiptap-editor/blockquote";
import { Bold, RichTextBold } from "reactjs-tiptap-editor/bold";
import {
  BulletList,
  RichTextBulletList,
} from "reactjs-tiptap-editor/bulletlist";
import { Clear, RichTextClear } from "reactjs-tiptap-editor/clear";
import { Code, RichTextCode } from "reactjs-tiptap-editor/code";
import { CodeBlock, RichTextCodeBlock } from "reactjs-tiptap-editor/codeblock";
import { CodeView, RichTextCodeView } from "reactjs-tiptap-editor/codeview";
import { Color, RichTextColor } from "reactjs-tiptap-editor/color";
import {
  Column,
  ColumnNode,
  MultipleColumnNode,
  RichTextColumn,
} from "reactjs-tiptap-editor/column";
import { Drawer, RichTextDrawer } from "reactjs-tiptap-editor/drawer";
import { Emoji, RichTextEmoji } from "reactjs-tiptap-editor/emoji";
import {
  Excalidraw,
  RichTextExcalidraw,
} from "reactjs-tiptap-editor/excalidraw";
import { ExportPdf, RichTextExportPdf } from "reactjs-tiptap-editor/exportpdf";
import {
  ExportWord,
  RichTextExportWord,
} from "reactjs-tiptap-editor/exportword";
import {
  FontFamily,
  RichTextFontFamily,
} from "reactjs-tiptap-editor/fontfamily";
import { FontSize, RichTextFontSize } from "reactjs-tiptap-editor/fontsize";
import { Heading, RichTextHeading } from "reactjs-tiptap-editor/heading";
import { Highlight, RichTextHighlight } from "reactjs-tiptap-editor/highlight";
import {
  History,
  RichTextRedo,
  RichTextUndo,
} from "reactjs-tiptap-editor/history";
import {
  HorizontalRule,
  RichTextHorizontalRule,
} from "reactjs-tiptap-editor/horizontalrule";
import { Iframe, RichTextIframe } from "reactjs-tiptap-editor/iframe";
import { Image, RichTextImage } from "reactjs-tiptap-editor/image";
import { ImageGif, RichTextImageGif } from "reactjs-tiptap-editor/imagegif";
import {
  ImportWord,
  RichTextImportWord,
} from "reactjs-tiptap-editor/importword";
import { Indent, RichTextIndent } from "reactjs-tiptap-editor/indent";
import { Italic, RichTextItalic } from "reactjs-tiptap-editor/italic";
import { Katex, RichTextKatex } from "reactjs-tiptap-editor/katex";
import {
  LineHeight,
  RichTextLineHeight,
} from "reactjs-tiptap-editor/lineheight";
import { Link, RichTextLink } from "reactjs-tiptap-editor/link";
import { Mention } from "reactjs-tiptap-editor/mention";
import { Mermaid, RichTextMermaid } from "reactjs-tiptap-editor/mermaid";
import { MoreMark, RichTextMoreMark } from "reactjs-tiptap-editor/moremark";
import {
  OrderedList,
  RichTextOrderedList,
} from "reactjs-tiptap-editor/orderedlist";
import {
  RichTextSearchAndReplace,
  SearchAndReplace,
} from "reactjs-tiptap-editor/searchandreplace";
import { RichTextStrike, Strike } from "reactjs-tiptap-editor/strike";
import { RichTextTable, Table } from "reactjs-tiptap-editor/table";
import { RichTextTaskList, TaskList } from "reactjs-tiptap-editor/tasklist";
import { RichTextAlign, TextAlign } from "reactjs-tiptap-editor/textalign";
import {
  RichTextTextDirection,
  TextDirection,
} from "reactjs-tiptap-editor/textdirection";
import {
  RichTextUnderline,
  TextUnderline,
} from "reactjs-tiptap-editor/textunderline";
import { RichTextTwitter, Twitter } from "reactjs-tiptap-editor/twitter";
import { RichTextVideo, Video } from "reactjs-tiptap-editor/video";
import { RichTextCallout, Callout } from "reactjs-tiptap-editor/callout";

// Slash Command
import {
  SlashCommand,
  SlashCommandList,
} from "reactjs-tiptap-editor/slashcommand";

import {
  RichTextBubbleColumns,
  RichTextBubbleDrawer,
  RichTextBubbleExcalidraw,
  RichTextBubbleIframe,
  RichTextBubbleImage,
  RichTextBubbleImageGif,
  RichTextBubbleKatex,
  RichTextBubbleLink,
  RichTextBubbleMermaid,
  RichTextBubbleTable,
  RichTextBubbleText,
  RichTextBubbleTwitter,
  RichTextBubbleVideo,
  RichTextBubbleCallout,
  RichTextBubbleCodeBlock,
  RichTextBubbleMenuDragHandle,
} from "reactjs-tiptap-editor/bubble";

import { themeActions } from "reactjs-tiptap-editor/theme";
import useMediaQuery from "@mui/material/useMediaQuery";

import "reactjs-tiptap-editor/style.css";
import { Step } from "@tiptap/pm/transform";
// import "./text-editor.css";

const BaseKit = [
  // Document.extend({ selectable: true, draggable: true }),
  // Text.extend({ selectable: true, draggable: true }),
  Document.extend({
    content: "(block|columns)+",
  }),
  Text,
  Dropcursor,
  Gapcursor,
  HardBreak,
  Paragraph,
  TrailingNode,
  ListItem,
  // Selection.configure({ className: "select" }),
  TextStyle,
  // Placeholder.configure({
  //   placeholder: "Press '/' for commands",
  // }),
];

const extensions = [
  ...BaseKit,
  // StarterKit,

  History,
  SearchAndReplace,
  Clear,
  FontFamily,
  Heading,
  FontSize,
  Bold,
  Italic,
  TextUnderline,
  Strike,
  MoreMark,
  Emoji,
  Color,
  Highlight,
  BulletList,
  OrderedList,
  TextAlign,
  Indent,
  LineHeight,
  TaskList,
  Link,
  Image.configure({
    upload: (files: File) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(URL.createObjectURL(files));
        }, 300);
      });
    },
  }),
  Video.configure({
    upload: (files: File) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(URL.createObjectURL(files));
        }, 300);
      });
    },
  }),
  // ImageGif.configure({
  //   provider: "giphy",
  //   API_KEY: process.env.NEXT_PUBLIC_GIPHY_API_KEY as string,
  // }),
  Blockquote,
  HorizontalRule,
  Code,
  //   CodeBlock.configure({
  //     lowlight,
  //   }),
  Column,
  ColumnNode,
  MultipleColumnNode,
  Table,
  Iframe,
  Katex,
  //   ExportPdf,
  //   ImportWord,
  //   ExportWord,
  // TextDirection,
  // Attachment.configure({
  //   upload: (file: any) => {
  //     const reader = new FileReader();
  //     reader.readAsArrayBuffer(file);
  //     return new Promise((resolve) => {
  //       setTimeout(() => {
  //         resolve(
  //           URL.createObjectURL(new Blob([reader.result as ArrayBuffer])),
  //         );
  //       }, 300);
  //     });
  //   },
  // }),
  //   Excalidraw,
  // Mermaid,
  // Drawer,
  // Mermaid.configure({
  //   upload: (file: any) => {
  //     // fake upload return base 64
  //     const reader = new FileReader();
  //     reader.readAsDataURL(file);

  //     return new Promise((resolve) => {
  //       setTimeout(() => {
  //         const blob = convertBase64ToBlob(reader.result as string);
  //         resolve(URL.createObjectURL(blob));
  //       }, 300);
  //     });
  //   },
  // }),
  // Drawer.configure({
  //   upload: (file: any) => {
  //     // fake upload return base 64
  //     const reader = new FileReader();
  //     reader.readAsDataURL(file);

  //     return new Promise((resolve) => {
  //       setTimeout(() => {
  //         const blob = convertBase64ToBlob(reader.result as string);
  //         resolve(URL.createObjectURL(blob));
  //       }, 300);
  //     });
  //   },
  // }),
  //   Mention.configure({
  //     // suggestion: {
  //     //   char: '@',
  //     //   items: async ({ query }: any) => {
  //     //     return MOCK_USERS.filter(item => item.label.toLowerCase().startsWith(query.toLowerCase()));
  //     //   },
  //     // }
  //     suggestions: [
  //       {
  //         char: '@',
  //         items: async ({ query }: any) => {
  //           return MOCK_USERS.filter((item) =>
  //             item.label.toLowerCase().startsWith(query.toLowerCase()),
  //           );
  //         },
  //       },
  //       {
  //         char: '#',
  //         items: async ({ query }: any) => {
  //           return MOCK_USERS.filter((item) =>
  //             item.label.toLowerCase().startsWith(query.toLowerCase()),
  //           );
  //         },
  //       },
  //     ],
  //   }),
  // SlashCommand,
  // CodeView,
  // Callout,
];

const RichTextToolbar = () => {
  return (
    <div className="flex items-center p-1 gap-2 flex-wrap">
      <RichTextUndo />
      <RichTextRedo />
      <RichTextSearchAndReplace />
      <RichTextClear />
      <RichTextFontFamily />
      <RichTextHeading />
      <RichTextFontSize />
      <RichTextBold />
      <RichTextItalic />
      <RichTextUnderline />
      <RichTextStrike />
      <RichTextMoreMark />
      <RichTextEmoji />
      <RichTextColor />
      <RichTextHighlight />
      <RichTextBulletList />
      <RichTextOrderedList />
      <RichTextAlign />
      <RichTextIndent />
      <RichTextLineHeight />
      <RichTextTaskList />
      <RichTextLink />
      <RichTextImage />
      <RichTextVideo />
      {/* <RichTextImageGif /> */}
      <RichTextBlockquote />
      <RichTextHorizontalRule />
      <RichTextCode />
      <RichTextCodeBlock />
      <RichTextColumn />
      <RichTextTable />
      <RichTextAttachment />
      <RichTextTextDirection />
      <RichTextIframe />
      <RichTextKatex />
      {/* <RichTextExportPdf />
      <RichTextImportWord />
      <RichTextExportWord /> */}
      {/* <RichTextMermaid /> */}
      {/* <RichTextDrawer /> */}
      {/* <RichTextExcalidraw />
      <RichTextTwitter /> */}
      {/* <RichTextCodeView /> */}
      {/* <RichTextCallout /> */}
    </div>
  );
};

export default function TextEditor(props: {
  content?: string;
  onCreate?: (value: Editor) => void;
  onUpdate?: (value: string) => void;
  onStep?: (value: Step[]) => void;
}) {
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  const isSmall = useMediaQuery("(width < 37.5rem)");
  // const [content, setContent] = useState("");

  // const onValueChange = useCallback((value: string) => {
  //   setContent(value);
  // }, []);

  const editor = useEditor({
    // shouldRerenderOnTransaction:  false,
    editable: true,
    textDirection: "auto",
    content: props.content,
    extensions,
    immediatelyRender: false,
    // injectCSS: false,
    onCreate: (params) => {
      props.onCreate?.(params.editor);
    },
    onUpdate: (params) => {
      props.onUpdate?.(params.editor.getHTML());
    },
    onTransaction: (params) => {
      if (!params.transaction.steps.length) {
        return;
      }
      const steps = params.transaction.steps.map((step) => step.toJSON());
      props.onStep?.(steps);
    },
  })!;

  useLayoutEffect(() => {
    themeActions.setTheme(prefersDarkMode ? "dark" : "light");
    themeActions.setBorderRadius("0.5rem");
  });

  return (
    <>
      <RichTextProvider editor={editor}>
        <div className="overflow-hidden">
          <div className="flex w-full flex-col">
            <RichTextToolbar />
            <EditorContent editor={editor} />

            <RichTextBubbleColumns />
            <RichTextBubbleDrawer />
            {/* <RichTextBubbleExcalidraw /> */}
            <RichTextBubbleIframe />
            <RichTextBubbleKatex />
            <RichTextBubbleLink />

            <RichTextBubbleImage />
            <RichTextBubbleVideo />
            {/* <RichTextBubbleImageGif /> */}

            <RichTextBubbleMermaid />
            <RichTextBubbleTable />
            <RichTextBubbleText />
            {/* <RichTextBubbleTwitter /> */}
            <RichTextBubbleCallout />
            {/* <RichTextBubbleCodeBlock /> */}

            {!isSmall && <RichTextBubbleMenuDragHandle />}

            {/* <SlashCommandList /> */}
          </div>
        </div>
      </RichTextProvider>
    </>
  );
}
