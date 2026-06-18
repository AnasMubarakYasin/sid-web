"use client";

import {
  Editor,
  EditorContent,
  useEditor,
  generateHTML,
  generateText,
  fromString,
  createNodeFromContent,
  generateJSON,
} from "@tiptap/react";
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
import { Bold, RichTextBold } from "reactjs-tiptap-editor/bold";
import { Italic, RichTextItalic } from "reactjs-tiptap-editor/italic";
import { Strike, RichTextStrike } from "reactjs-tiptap-editor/strike";
import {
  TextUnderline,
  RichTextUnderline,
} from "reactjs-tiptap-editor/textunderline";

import {
  OrderedList,
  RichTextOrderedList,
} from "reactjs-tiptap-editor/orderedlist";

import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCaret from "@tiptap/extension-collaboration-caret";
import Highlight from "@tiptap/extension-highlight";

// import * as Y from 'yjs'

import { EditorState, Selection } from "@tiptap/pm/state";
import { ReplaceStep, Step, Transform } from "@tiptap/pm/transform";

import useMediaQuery from "@mui/material/useMediaQuery";
import { themeActions } from "reactjs-tiptap-editor/theme";

import { useLayoutEffect, useRef } from "react";

import "reactjs-tiptap-editor/style.css";
// import "./text-editor.css";a

// const ydocA = new Y.Doc()

const extensions = [
  // Base Extensions
  // Document,
  Document.extend({ content: "orderedList*" }),
  Text,
  Dropcursor,
  Gapcursor,
  HardBreak,
  Paragraph,
  TrailingNode,
  ListItem,
  TextStyle,
  // Placeholder.configure({
  //   placeholder:
  //     "Ketik pertanyaan disini, tekan enter untuk menambah pertanyaan",
  // }),
  // Highlight,
  History,
  Bold,
  Italic,
  TextUnderline,
  Strike,
  OrderedList,
];

const RichTextToolbar = () => {
  return (
    <div className="flex items-center p-1 gap-2 flex-wrap">
      {/* <RichTextHistory /> */}
      <RichTextUndo />
      <RichTextRedo />
      <RichTextBold />
      <RichTextItalic />
      <RichTextUnderline />
      <RichTextStrike />
      <RichTextOrderedList />
    </div>
  );
};

const parser = new DOMParser();

function convert(value: string[]) {
  let content = "<ol>";
  for (const element of value) {
    content += `<li>${element}</li>`;
  }
  return (content += "</ol>");
}

export default function TextList(props: {
  value?: string[];
  onCreate?: (value: Editor) => void;
  onUpdate?: (value: string[]) => void;
  onStep?: (value: Step[]) => void;
}) {
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  const editor = useEditor({
    editable: true,
    textDirection: "auto",
    extensions,
    // extensions: [
    //   ...extensions,
    //   Collaboration.extend().configure({
    //     document: ydocA
    //   }),
    //   CollaborationCaret,
    // ],
    // content: props.value,
    // content: "<ol><li></li></ol>",
    content: props.value ? convert(props.value) : "<ol><li></li></ol>",
    immediatelyRender: false,
    enableContentCheck: true,
    onCreate: (params) => {
      props.onCreate?.(params.editor);
      // console.log("text-list", props.value);
      // console.log(fromString(props.value));
      // console.log(
      //   createNodeFromContent(
      //     props.value,
      //     params.editor.schema,
      //     params.editor.options,
      //   ),
      // );
    },
    onUpdate: (params) => {
      const value: string[] = [];
      for (const element of parser.parseFromString(
        params.editor.getHTML(),
        "text/html",
      ).body.firstElementChild!.children) {
        value.push(element.textContent);
      }
      props.onUpdate?.(value);
      // const state = params.editor.state.toJSON();
      // const steps = params.transaction.steps.map((step) => step.toJSON());
      // props.onUpdate?.({
      //   doc: state.doc,
      //   selection: state.selection,
      //   steps: steps,
      //   content: params.editor.getHTML(),
      // });
    },
    onTransaction: (params) => {
      if (!params.transaction.steps.length) {
        return;
      }
      const steps = params.transaction.steps.map((step) => step.toJSON());
      props.onStep?.(steps);
    },
    onContentError: (...args) => {
      console.error(...args);
    },
  });
  useLayoutEffect(() => {
    themeActions.setTheme(prefersDarkMode ? "dark" : "light");
    themeActions.setBorderRadius("0.5rem");
  });
  useLayoutEffect(() => {
    if (!editor || !props.value) {
      return;
    }
    // console.log("text-list", convert(props.value));
    // editor.view.pasteHTML(props.value);
    return () => {
      //   editor.$doc.range
      //   editor.state.doc.si
      //   editor.state.tr.delete()
      // new Transform(editor.state.doc).step(step)
      // editor.view.state.tr.delete(0, editor.$doc.size)
      // for (const children of editor.view.dom.children) {
      //   children.remove();
      // }
    };
  }, [props.value]);

  return (
    <RichTextProvider editor={editor!}>
      <RichTextToolbar />

      <EditorContent editor={editor} className="text-list"/>
    </RichTextProvider>
  );
}
