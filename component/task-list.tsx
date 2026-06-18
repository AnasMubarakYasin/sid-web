import { EditorContent, useEditor } from "@tiptap/react";
import { RichTextProvider } from "reactjs-tiptap-editor";

// Base Kit
import { Document } from "@tiptap/extension-document";
import { Text } from "@tiptap/extension-text";
import { Paragraph } from "@tiptap/extension-paragraph";
import {
  Dropcursor,
  Gapcursor,
  Placeholder,
  TrailingNode,
} from "@tiptap/extensions";
import { HardBreak } from "@tiptap/extension-hard-break";
import { TextStyle } from "@tiptap/extension-text-style";
import { ListItem } from "@tiptap/extension-list";
import {
  History,
  RichTextRedo,
  RichTextUndo,
} from "reactjs-tiptap-editor/history";
import {
  OrderedList,
  RichTextOrderedList,
} from "reactjs-tiptap-editor/orderedlist";
import { TaskList as ExtTaskList, RichTextTaskList } from 'reactjs-tiptap-editor/tasklist';

import useMediaQuery from "@mui/material/useMediaQuery";
import { themeActions } from "reactjs-tiptap-editor/theme";

// Import CSS
import "reactjs-tiptap-editor/style.css";
import { useLayoutEffect } from "react";

const extensions = [
  // Base Extensions
  Document.extend({ content: "list+" }),
  Text,
  Dropcursor,
  Gapcursor,
  HardBreak,
  Paragraph,
  //   TrailingNode,
  ListItem,
  TextStyle,
  Placeholder.configure({
    placeholder:
      "Ketik pertanyaan disini, tekan enter untuk menambah pertanyaan",
  }),
  ExtTaskList,
  // History,
  // OrderedList.configure({}),
];

const RichTextToolbar = () => {
  return (
    <div className="flex items-center p-1 gap-2 flex-wrap">
      {/* <RichTextUndo /> */}
      {/* <RichTextRedo /> */}
      {/* <RichTextOrderedList /> */}
      <RichTextTaskList />
    </div>
  );
};

export default function TaskList() {
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  const editor = useEditor({
    textDirection: "auto", // global text direction
    extensions,
    content: "<ol><li></li></ol>",
    enableContentCheck: true,
    onContentError: (...args) => {
      console.log(args);
    },
  });
  useLayoutEffect(() => {
    themeActions.setTheme(prefersDarkMode ? "dark" : "light");
  });

  return (
    <RichTextProvider editor={editor}>
      <RichTextToolbar />

      <EditorContent editor={editor} />
    </RichTextProvider>
  );
}
