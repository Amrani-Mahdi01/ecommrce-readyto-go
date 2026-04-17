'use client';

import { useEditor, EditorContent, Extension } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import { TextStyle } from '@tiptap/extension-text-style';
import {
  Bold, Italic, UnderlineIcon, Strikethrough,
  AlignLeft, AlignCenter, AlignRight,
  List, ListOrdered, Minus, Undo, Redo,
} from 'lucide-react';
import { useEffect } from 'react';

// ── Inline FontSize extension ─────────────────────────────────────────────────
const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() { return { types: ['textStyle'] }; },
  addGlobalAttributes() {
    return [{
      types: this.options.types,
      attributes: {
        fontSize: {
          default: null,
          parseHTML: (el) => (el as HTMLElement).style.fontSize || null,
          renderHTML: (attrs) => {
            if (!attrs.fontSize) return {};
            return { style: `font-size: ${attrs.fontSize}` };
          },
        },
      },
    }];
  },
  addCommands() {
    return {
      setFontSize: (size: string) => ({ chain }: any) =>
        chain().setMark('textStyle', { fontSize: size }).run(),
      unsetFontSize: () => ({ chain }: any) =>
        chain().setMark('textStyle', { fontSize: null }).run(),
    } as any;
  },
});

const FONT_SIZES = [
  { label: 'S',   value: '0.8rem',  title: 'Small' },
  { label: 'M',   value: null,      title: 'Normal' },
  { label: 'L',   value: '1.2rem',  title: 'Large' },
  { label: 'XL',  value: '1.5rem',  title: 'X-Large' },
  { label: 'XXL', value: '2rem',    title: 'XX-Large' },
];

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  dir?: 'ltr' | 'rtl';
}

export function RichTextEditor({ value, onChange, placeholder, dir = 'ltr' }: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: false }),
      Underline,
      TextStyle,
      FontSize,
      TextAlign.configure({ types: ['paragraph'] }),
      Placeholder.configure({ placeholder: placeholder ?? 'Start typing...' }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: 'tiptap min-h-[160px] px-4 py-3 text-sm text-foreground',
        dir,
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html === '<p></p>' ? '' : html);
    },
  });

  // Sync when switching between products
  useEffect(() => {
    if (!editor) return;
    if (editor.getHTML() !== value) {
      editor.commands.setContent(value || '');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  if (!editor) return null;

  // Get current font size from cursor position
  const currentSize = (editor.getAttributes('textStyle') as any)?.fontSize ?? null;

  return (
    <div className="rounded-lg border border-input bg-background overflow-hidden">
      {/* ── Toolbar ────────────────────────────────────────────── */}
      <div className={`flex flex-wrap items-center gap-0.5 p-1.5 border-b border-input bg-muted/30 ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>

        {/* Undo / Redo */}
        <Btn onClick={() => editor.chain().focus().undo().run()} title="Undo"><Undo className="h-3.5 w-3.5" /></Btn>
        <Btn onClick={() => editor.chain().focus().redo().run()} title="Redo"><Redo className="h-3.5 w-3.5" /></Btn>
        <Sep />

        {/* Font size — inline, affects only selection */}
        <div className={`flex items-center gap-0.5 ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
          {FONT_SIZES.map((fs) => {
            const active = fs.value === null ? currentSize === null : currentSize === fs.value;
            return (
              <Btn
                key={fs.label}
                active={active}
                title={fs.title}
                onClick={() => {
                  if (fs.value === null) {
                    (editor.chain().focus() as any).unsetFontSize().run();
                  } else {
                    (editor.chain().focus() as any).setFontSize(fs.value).run();
                  }
                }}
              >
                <span className="text-[10px] font-bold w-5 text-center">{fs.label}</span>
              </Btn>
            );
          })}
        </div>
        <Sep />

        {/* Marks */}
        <Btn active={editor.isActive('bold')}      onClick={() => editor.chain().focus().toggleBold().run()}      title="Bold">      <Bold          className="h-3.5 w-3.5" /></Btn>
        <Btn active={editor.isActive('italic')}    onClick={() => editor.chain().focus().toggleItalic().run()}    title="Italic">    <Italic        className="h-3.5 w-3.5" /></Btn>
        <Btn active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline"> <UnderlineIcon className="h-3.5 w-3.5" /></Btn>
        <Btn active={editor.isActive('strike')}    onClick={() => editor.chain().focus().toggleStrike().run()}    title="Strike">    <Strikethrough className="h-3.5 w-3.5" /></Btn>
        <Sep />

        {/* Lists */}
        <Btn active={editor.isActive('bulletList')}  onClick={() => editor.chain().focus().toggleBulletList().run()}  title="Bullet list">   <List        className="h-3.5 w-3.5" /></Btn>
        <Btn active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Numbered list"> <ListOrdered className="h-3.5 w-3.5" /></Btn>
        <Sep />

        {/* Alignment */}
        <Btn active={editor.isActive({ textAlign: 'left' })}   onClick={() => editor.chain().focus().setTextAlign('left').run()}   title="Left">   <AlignLeft   className="h-3.5 w-3.5" /></Btn>
        <Btn active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()} title="Center"> <AlignCenter className="h-3.5 w-3.5" /></Btn>
        <Btn active={editor.isActive({ textAlign: 'right' })}  onClick={() => editor.chain().focus().setTextAlign('right').run()}  title="Right">  <AlignRight  className="h-3.5 w-3.5" /></Btn>
        <Sep />

        {/* Divider */}
        <Btn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divider"><Minus className="h-3.5 w-3.5" /></Btn>
      </div>

      {/* ── Editor area ────────────────────────────────────────── */}
      <EditorContent editor={editor} />
    </div>
  );
}

function Btn({
  onClick, active = false, title, children,
}: {
  onClick: () => void;
  active?: boolean;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      title={title}
      className={`p-1.5 rounded transition-colors ${
        active
          ? 'bg-primary text-primary-foreground'
          : 'hover:bg-accent text-muted-foreground'
      }`}
    >
      {children}
    </button>
  );
}

function Sep() {
  return <div className="w-px h-4 bg-border mx-0.5 shrink-0" />;
}
