import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link,
  Unlink,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Undo,
  Redo,
  Code,
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

interface ToolbarButton {
  icon: React.ReactNode;
  command: string;
  value?: string;
  title: string;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Enter content...',
  minHeight = '200px',
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [savedSelection, setSavedSelection] = useState<Range | null>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  const execCommand = useCallback((command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  }, []);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const saveSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      setSavedSelection(selection.getRangeAt(0).cloneRange());
    }
  };

  const restoreSelection = () => {
    if (savedSelection) {
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(savedSelection);
    }
  };

  const handleLink = () => {
    saveSelection();
    setShowLinkModal(true);
  };

  const insertLink = () => {
    restoreSelection();
    if (linkUrl) {
      execCommand('createLink', linkUrl);
    }
    setShowLinkModal(false);
    setLinkUrl('');
  };

  const removeLink = () => {
    execCommand('unlink');
  };

  const toolbarButtons: ToolbarButton[][] = [
    [
      { icon: <Undo className="w-4 h-4" />, command: 'undo', title: 'Undo' },
      { icon: <Redo className="w-4 h-4" />, command: 'redo', title: 'Redo' },
    ],
    [
      { icon: <Bold className="w-4 h-4" />, command: 'bold', title: 'Bold' },
      { icon: <Italic className="w-4 h-4" />, command: 'italic', title: 'Italic' },
      { icon: <Underline className="w-4 h-4" />, command: 'underline', title: 'Underline' },
      { icon: <Code className="w-4 h-4" />, command: 'formatBlock', value: 'pre', title: 'Code' },
    ],
    [
      { icon: <Heading1 className="w-4 h-4" />, command: 'formatBlock', value: 'h1', title: 'Heading 1' },
      { icon: <Heading2 className="w-4 h-4" />, command: 'formatBlock', value: 'h2', title: 'Heading 2' },
      { icon: <Heading3 className="w-4 h-4" />, command: 'formatBlock', value: 'h3', title: 'Heading 3' },
      { icon: <Quote className="w-4 h-4" />, command: 'formatBlock', value: 'blockquote', title: 'Quote' },
    ],
    [
      { icon: <List className="w-4 h-4" />, command: 'insertUnorderedList', title: 'Bullet List' },
      { icon: <ListOrdered className="w-4 h-4" />, command: 'insertOrderedList', title: 'Numbered List' },
    ],
    [
      { icon: <AlignLeft className="w-4 h-4" />, command: 'justifyLeft', title: 'Align Left' },
      { icon: <AlignCenter className="w-4 h-4" />, command: 'justifyCenter', title: 'Align Center' },
      { icon: <AlignRight className="w-4 h-4" />, command: 'justifyRight', title: 'Align Right' },
    ],
  ];

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
      <div className="flex flex-wrap items-center gap-1 p-2 bg-gray-50 border-b border-gray-200">
        {toolbarButtons.map((group, groupIndex) => (
          <div key={groupIndex} className="flex items-center gap-1">
            {group.map((button, btnIndex) => (
              <button
                key={btnIndex}
                type="button"
                onClick={() => execCommand(button.command, button.value)}
                title={button.title}
                className="p-2 rounded hover:bg-gray-200 transition-colors text-gray-700"
              >
                {button.icon}
              </button>
            ))}
            {groupIndex < toolbarButtons.length - 1 && (
              <div className="w-px h-6 bg-gray-300 mx-1" />
            )}
          </div>
        ))}
        <div className="w-px h-6 bg-gray-300 mx-1" />
        <button
          type="button"
          onClick={handleLink}
          title="Insert Link"
          className="p-2 rounded hover:bg-gray-200 transition-colors text-gray-700"
        >
          <Link className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={removeLink}
          title="Remove Link"
          className="p-2 rounded hover:bg-gray-200 transition-colors text-gray-700"
        >
          <Unlink className="w-4 h-4" />
        </button>
      </div>

      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onBlur={handleInput}
        className="p-4 outline-none prose prose-sm max-w-none"
        style={{ minHeight }}
        data-placeholder={placeholder}
      />

      {showLinkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-semibold mb-4">Insert Link</h3>
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-primary focus:border-primary"
              autoFocus
            />
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowLinkModal(false);
                  setLinkUrl('');
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={insertLink}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
              >
                Insert
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
        [contenteditable] h1 { font-size: 2em; font-weight: bold; margin: 0.67em 0; }
        [contenteditable] h2 { font-size: 1.5em; font-weight: bold; margin: 0.83em 0; }
        [contenteditable] h3 { font-size: 1.17em; font-weight: bold; margin: 1em 0; }
        [contenteditable] blockquote {
          border-left: 4px solid #e5e7eb;
          padding-left: 1em;
          margin: 1em 0;
          color: #6b7280;
        }
        [contenteditable] pre {
          background: #f3f4f6;
          padding: 1em;
          border-radius: 0.5em;
          font-family: monospace;
          overflow-x: auto;
        }
        [contenteditable] ul { list-style-type: disc; padding-left: 2em; }
        [contenteditable] ol { list-style-type: decimal; padding-left: 2em; }
        [contenteditable] a { color: #2563eb; text-decoration: underline; }
      `}</style>
    </div>
  );
}
