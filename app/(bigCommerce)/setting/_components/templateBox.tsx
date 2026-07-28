"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import { Code2, ImageIcon } from "lucide-react";

import {
  TEMPLATE_VARIABLES,
  applyFilenameTemplatePreview,
  applyTemplatePreview,
  getVariableLabel,
} from "../_lib/templatePreview";

type TemplateBoxProps = {
  title: string;
  description?: string;
  templateValue: string;
  onTemplateChange: (next: string) => void;
  enabled: boolean;
  onEnabledChange: (next: boolean) => void;
  defaultTemplate?: string;
  previewMode?: "alt" | "filename";
  outputFormat?: string;
  variant?: "card" | "inline";
};

const CHIP_CLASS =
  "inline-flex max-w-full items-center gap-1 rounded-md border border-gray-200 bg-gray-100 px-2 align-middle text-[12px] leading-tight text-gray-800 select-none";

function serializeEditor(root: HTMLElement): string {
  let result = "";

  root.childNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      result += (node.textContent ?? "")
        .replace(/\u200B/g, "")
        .replace(/[\r\n]+/g, "");
      return;
    }

    if (!(node instanceof HTMLElement)) return;

    // Never treat line breaks as content — this editor is single-line only.
    if (node.tagName === "BR") return;

    if (node.dataset.token) {
      result += `[${node.dataset.token}]`;
      return;
    }

    result += serializeEditor(node);
  });

  return result;
}

/** Flatten contenteditable DOM so no <br>/block wrappers remain.
 *  Returns true only when the DOM was mutated.
 */
function flattenEditorToSingleLine(editor: HTMLElement): boolean {
  const breaks = editor.querySelectorAll("br");
  const blocks = Array.from(editor.querySelectorAll("div, p")).filter(
    (block) => !(block instanceof HTMLElement && block.dataset.token),
  );
  const textNodesWithNewlines = Array.from(editor.childNodes).filter(
    (node) =>
      node.nodeType === Node.TEXT_NODE &&
      /[\r\n]/.test(node.textContent ?? ""),
  );

  // Critical: do not touch the DOM on normal typing — assigning textContent
  // resets the caret to the start (appears as reverse typing).
  if (
    breaks.length === 0 &&
    blocks.length === 0 &&
    textNodesWithNewlines.length === 0
  ) {
    return false;
  }

  breaks.forEach((br) => br.remove());

  blocks.forEach((block) => {
    const parent = block.parentNode;
    if (!parent) return;
    while (block.firstChild) {
      parent.insertBefore(block.firstChild, block);
    }
    parent.removeChild(block);
  });

  textNodesWithNewlines.forEach((node) => {
    if (node.textContent) {
      node.textContent = node.textContent.replace(/[\r\n]+/g, "");
    }
  });

  ensureTrailingEditableTextNode(editor);

  if (document.activeElement === editor) {
    placeCaretAtEnd(editor);
  }

  return true;
}

function createChipElement(token: string) {
  const chip = document.createElement("span");
  chip.contentEditable = "false";
  chip.dataset.token = token;
  chip.className = CHIP_CLASS;

  const label = document.createElement("span");
  label.textContent = getVariableLabel(token);
  chip.appendChild(label);

  const removeButton = document.createElement("button");
  removeButton.type = "button";
  removeButton.dataset.removeChip = "true";
  removeButton.className =
    "inline-flex text-[18px] items-center justify-center rounded text-gray-400 hover:text-gray-700 cursor-pointer";
  removeButton.setAttribute("aria-label", `Remove ${token}`);
  removeButton.textContent = "×";
  chip.appendChild(removeButton);

  return chip;
}

function populateEditor(root: HTMLElement, template: string) {
  root.innerHTML = "";

  if (!template) {
    root.appendChild(document.createTextNode("\u200B"));
    return;
  }

  const parts = template.split(/(\[[^\]]+\])/g).filter((part) => part.length > 0);
  for (const part of parts) {
    const match = part.match(/^\[([^\]]+)\]$/);
    if (match) {
      root.appendChild(createChipElement(match[1]));
      continue;
    }
    root.appendChild(document.createTextNode(part));
  }

  const lastChild = root.lastChild;
  if (!lastChild || lastChild.nodeType !== Node.TEXT_NODE) {
    root.appendChild(document.createTextNode("\u200B"));
  }
}

function insertAtCursor(node: Node, editor: HTMLElement) {
  const selection = window.getSelection();
  if (!selection) {
    editor.appendChild(node);
    return;
  }

  let range = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
  if (!range || !editor.contains(range.commonAncestorContainer)) {
    range = document.createRange();
    range.selectNodeContents(editor);
    range.collapse(false);
  }

  range.deleteContents();
  range.insertNode(node);

  const spacer = document.createTextNode("\u200B");
  range.setStartAfter(node);
  range.insertNode(spacer);
  range.setStartAfter(spacer);
  range.collapse(true);

  selection.removeAllRanges();
  selection.addRange(range);
}

function placeCaretAtEnd(editor: HTMLElement) {
  const selection = window.getSelection();
  if (!selection) return;

  const range = document.createRange();
  range.selectNodeContents(editor);
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
}

function ensureTrailingEditableTextNode(editor: HTMLElement) {
  const lastChild = editor.lastChild;
  if (!lastChild) {
    editor.appendChild(document.createTextNode("\u200B"));
    return;
  }

  if (lastChild.nodeType !== Node.TEXT_NODE) {
    editor.appendChild(document.createTextNode("\u200B"));
    return;
  }

  // Only fill empty text nodes — never reassign content that already exists
  // (that would reset the caret).
  if ((lastChild.textContent ?? "").length === 0) {
    lastChild.textContent = "\u200B";
  }
}

function captureEditorSelection(
  editor: HTMLElement | null,
  savedRangeRef: { current: Range | null },
) {
  if (!editor) return;
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;
  if (!editor.contains(selection.anchorNode)) return;
  savedRangeRef.current = selection.getRangeAt(0).cloneRange();
}

function restoreEditorSelection(
  editor: HTMLElement,
  savedRange: Range | null,
) {
  if (!savedRange) return;
  const selection = window.getSelection();
  if (!selection) return;

  try {
    selection.removeAllRanges();
    selection.addRange(savedRange);
  } catch {
    placeCaretAtEnd(editor);
  }
}

function getChipBeforeCursor(editor: HTMLElement): HTMLElement | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;

  const range = selection.getRangeAt(0);
  if (!range.collapsed || !editor.contains(range.commonAncestorContainer)) {
    return null;
  }

  const { startContainer, startOffset } = range;

  if (startContainer.nodeType === Node.TEXT_NODE) {
    const text = startContainer.textContent ?? "";
    const beforeCursor = text.slice(0, startOffset).replace(/\u200B/g, "");

    if (beforeCursor.length === 0) {
      const previous = startContainer.previousSibling;
      if (previous instanceof HTMLElement && previous.dataset.token) {
        return previous;
      }
    }
    return null;
  }

  if (startContainer === editor) {
    const previous = editor.childNodes[startOffset - 1];
    if (previous instanceof HTMLElement && previous.dataset.token) {
      return previous;
    }
  }

  return null;
}

function ToggleSwitch({
  enabled,
  onToggle,
  label,
}: {
  enabled: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full px-0.5 transition-colors ${
        enabled ? "bg-[#155dfc]" : "bg-gray-300"
      }`}
    >
      <span
        className={`inline-block size-5 rounded-full bg-white shadow transition-transform ${
          enabled ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

export default function TemplateBox({
  title,
  description,
  templateValue,
  onTemplateChange,
  enabled,
  onEnabledChange,
  defaultTemplate = "[name]",
  previewMode = "alt",
  outputFormat = "webp",
  variant = "card",
}: TemplateBoxProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [dropdownPlacement, setDropdownPlacement] = useState<"bottom" | "top">(
    "bottom",
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const lastSyncedTemplateRef = useRef(templateValue);
  const savedRangeRef = useRef<Range | null>(null);

  const previewText = useMemo(() => {
    if (!enabled || !templateValue.trim()) return "";
    return previewMode === "filename"
      ? applyFilenameTemplatePreview(templateValue, outputFormat)
      : applyTemplatePreview(templateValue);
  }, [enabled, previewMode, outputFormat, templateValue]);

  const saveSelection = useCallback(() => {
    captureEditorSelection(editorRef.current, savedRangeRef);
  }, []);

  const syncFromEditor = useCallback(() => {
    if (!editorRef.current) return;
    flattenEditorToSingleLine(editorRef.current);
    // Only ensure trailing node when last child is a chip (no text after it).
    // Calling this unconditionally on every keystroke can disrupt the caret.
    const last = editorRef.current.lastChild;
    if (
      !last ||
      (last instanceof HTMLElement && last.dataset.token) ||
      (last.nodeType === Node.TEXT_NODE &&
        (last.textContent ?? "").length === 0)
    ) {
      ensureTrailingEditableTextNode(editorRef.current);
    }
    const next = serializeEditor(editorRef.current);
    lastSyncedTemplateRef.current = next;
    if (next !== templateValue) {
      onTemplateChange(next);
    }
  }, [onTemplateChange, templateValue]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    if (document.activeElement === editor) return;
    if (lastSyncedTemplateRef.current === templateValue) return;

    populateEditor(editor, templateValue);
    lastSyncedTemplateRef.current = templateValue;
  }, [templateValue]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || editor.childNodes.length > 0) return;
    populateEditor(editor, templateValue);
    lastSyncedTemplateRef.current = templateValue;
    // mount-only initial paint
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const insertVariable = useCallback(
    (variable: string) => {
      if (!enabled || !editorRef.current) return;

      const editor = editorRef.current;
      editor.focus();
      restoreEditorSelection(editor, savedRangeRef.current);
      insertAtCursor(createChipElement(variable), editor);
      ensureTrailingEditableTextNode(editor);
      syncFromEditor();
      saveSelection();
      setPickerOpen(false);
    },
    [enabled, saveSelection, syncFromEditor],
  );

  const handleEditorKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!editorRef.current) return;

    // Single-line only — block Enter / Shift+Enter / Ctrl+Enter.
    if (event.key === "Enter") {
      event.preventDefault();
      return;
    }

    if (event.key === "Backspace") {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);
      if (!range.collapsed) return;

      const chip = getChipBeforeCursor(editorRef.current);
      if (chip) {
        event.preventDefault();
        chip.remove();
        ensureTrailingEditableTextNode(editorRef.current);
        syncFromEditor();
      }
    }
  };

  const handleEditorClick = (event: MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (!target.closest("[data-remove-chip]")) return;

    event.preventDefault();
    const chip = target.closest("[data-token]");
    chip?.remove();
    if (editorRef.current) {
      ensureTrailingEditableTextNode(editorRef.current);
    }
    syncFromEditor();
    editorRef.current?.focus();
  };

  const handleEditorMouseUp = (event: MouseEvent<HTMLDivElement>) => {
    if (!editorRef.current) return;

    const target = event.target as HTMLElement;
    if (target.closest("[data-token]")) {
      saveSelection();
      return;
    }

    // Clicking text: browser already placed the caret — keep it for mid-edit.
    // Clicking empty padding (caret on the editor element itself): move to end.
    if (target === editorRef.current) {
      const selection = window.getSelection();
      const range =
        selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

      if (
        !range ||
        range.startContainer === editorRef.current
      ) {
        placeCaretAtEnd(editorRef.current);
      }
    }

    saveSelection();
  };

  const handleRevert = () => {
    if (!enabled) return;
    onTemplateChange(defaultTemplate);
    lastSyncedTemplateRef.current = defaultTemplate;
    if (editorRef.current) {
      populateEditor(editorRef.current, defaultTemplate);
      ensureTrailingEditableTextNode(editorRef.current);
      editorRef.current.focus();
      placeCaretAtEnd(editorRef.current);
    }
  };

  useEffect(() => {
    if (!pickerOpen) return;

    const onPointerDown = (event: globalThis.MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setPickerOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [pickerOpen]);

  useEffect(() => {
    if (!pickerOpen) return;

    const updatePlacement = () => {
      const triggerRect = triggerRef.current?.getBoundingClientRect();
      if (!triggerRect) return;

      const dropdownHeight = dropdownRef.current?.offsetHeight ?? 224;
      const spaceBelow = window.innerHeight - triggerRect.bottom;
      const spaceAbove = triggerRect.top;

      setDropdownPlacement(
        spaceBelow < dropdownHeight + 12 && spaceAbove > spaceBelow
          ? "top"
          : "bottom",
      );
    };

    updatePlacement();
    window.addEventListener("resize", updatePlacement);
    window.addEventListener("scroll", updatePlacement, true);
    return () => {
      window.removeEventListener("resize", updatePlacement);
      window.removeEventListener("scroll", updatePlacement, true);
    };
  }, [pickerOpen]);

  const showPlaceholder = enabled && !templateValue.trim();

  const editor = (
    <div ref={containerRef} className="space-y-2">
      <div
        className={`relative rounded-[6px] border border-[#8A8A8A] bg-[#FDFDFD] ${
          !enabled ? "opacity-60" : ""
        }`}
      >
        <div
          ref={editorRef}
          contentEditable={enabled}
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          aria-label={title}
          data-placeholder="Type here..."
          onInput={() => {
            syncFromEditor();
            saveSelection();
          }}
          onBeforeInput={(event) => {
            const nativeEvent = event.nativeEvent;
            if (
              nativeEvent instanceof InputEvent &&
              (nativeEvent.inputType === "insertParagraph" ||
                nativeEvent.inputType === "insertLineBreak")
            ) {
              event.preventDefault();
            }
          }}
          onKeyUp={saveSelection}
          onKeyDown={handleEditorKeyDown}
          onClick={handleEditorClick}
          onMouseUp={handleEditorMouseUp}
          onPaste={(event) => {
            event.preventDefault();
            const text = event.clipboardData
              .getData("text/plain")
              .replace(/[\r\n]+/g, " ");
            document.execCommand("insertText", false, text);
            syncFromEditor();
            saveSelection();
          }}
          className={`min-h-10 w-full overflow-hidden px-3 py-2 pr-11 text-[12px] font-normal leading-5 whitespace-pre-wrap wrap-break-word text-[#303030] outline-none ${
            showPlaceholder
              ? "empty:before:text-[#8A8A8A] empty:before:content-[attr(data-placeholder)]"
              : ""
          }`}
        />

        <div className="absolute top-2 right-2">
          <button
            ref={triggerRef}
            type="button"
            disabled={!enabled}
            onMouseDown={(event) => {
              event.preventDefault();
              saveSelection();
            }}
            onClick={() => setPickerOpen((open) => !open)}
            className="inline-flex size-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Add variable"
            aria-expanded={pickerOpen}
          >
            <Code2 className="size-4" />
          </button>

          {pickerOpen && enabled ? (
            <div
              ref={dropdownRef}
              className={`absolute right-0 z-30 max-h-56 w-52 overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg ${
                dropdownPlacement === "top"
                  ? "bottom-full mb-1"
                  : "top-full mt-1"
              }`}
            >
              {TEMPLATE_VARIABLES.map((variable) => (
                <button
                  key={variable.id}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => insertVariable(variable.id)}
                  className="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  <span className="font-medium">{variable.label}</span>
                  <span className="mt-0.5 block text-xs text-gray-400">
                    [{variable.id}]
                  </span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {enabled ? (
        <div className="flex items-start gap-2 rounded-lg bg-gray-50 px-3 py-2">
          <ImageIcon className="mt-0.5 size-4 shrink-0 text-gray-400" aria-hidden />
          <div className="min-w-0">
            <p className="text-[11px] font-medium tracking-wide text-gray-400 uppercase">
              Preview
            </p>
            <p className="mt-0.5 text-sm text-gray-700 wrap-break-word">
              {previewText ? `"${previewText}"` : "Enter a template to preview"}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );

  const headerActions = (
    <div className="flex items-center gap-3">
      <button
        type="button"
        disabled={!enabled || templateValue === defaultTemplate}
        onClick={handleRevert}
        className="text-xs font-medium text-[#155dfc] hover:underline disabled:cursor-not-allowed disabled:text-gray-400 disabled:no-underline"
      >
        Revert to default
      </button>
      <ToggleSwitch
        enabled={enabled}
        onToggle={() => onEnabledChange(!enabled)}
        label={enabled ? `Disable ${title}` : `Enable ${title}`}
      />
    </div>
  );

  if (variant === "inline") {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          {headerActions}
        </div>
        {editor}
      </div>
    );
  }

  return (
    <div className="card mb-0! space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="mb-0 text-base font-bold text-[#303030]">{title}</h3>
          {description ? (
            <p className="mt-1 mb-0 text-xs font-normal text-[#616161]">
              {description}
            </p>
          ) : null}
        </div>
        {headerActions}
      </div>
      {editor}
    </div>
  );
}
