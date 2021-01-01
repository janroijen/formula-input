import React, { SetStateAction, useEffect, useRef } from "react";
import styled from "styled-components";

const activeBackground = "#dddddd";
const white = "#eee";

const FormulaDiv = styled.div`
  background-color: ${(props: any) =>
    props["data-active"] ? activeBackground : white};
  border-radius: 3px;
  height: 100px;
  width: 500px;
  position: relative;

  font-size: 14px;
  line-height: 1.5em;
  margin: 0;
  padding: 10px;
  white-space: pre-wrap;
  word-wrap: break-word;

  &:read-write:focus {
    outline: none;
  }
`;
// This component uses a <div> with content editable. By using the execCommand to modify the
// content, the div maintains its caret postion. We also disallow certain editing actions as
// they are not relevant for editing formules.

function formatVariablesKeyDown(
  e: KeyboardEvent,
  nonVariableFontColor: string
) {
  const key = e.key;

  // Suppress inadventently pressing save.
  if ((e.ctrlKey || e.metaKey) && key === "s") {
    e.preventDefault();
    return;
  }

  // Suppress short-cuts for bold, italic, underline formatting.
  if (
    (e.ctrlKey || e.altKey || e.metaKey) &&
    (key === "b" || key === "u" || key === "i")
  ) {
    e.preventDefault();
    return;
  }

  const range = window.getSelection()?.getRangeAt(0);
  if (!range) {
    return;
  }

  const notArrowKey = key.substr(0, 5) !== "Arrow";

  // Ensure that only text-fragments with whole variable names are copied or cut.
  if ((e.ctrlKey || e.altKey || e.metaKey) && (key === "c" || key === "x")) {
    selectWholeVariables(range);
    console.log("test");
    if (key === "x") {
      switchOffVariableColor(nonVariableFontColor);
    }
    return;
  }

  // Ensure that only text-fragments with whole variable names are deleted or replaced.
  if (
    key === "Backspace" ||
    key === "Delete" ||
    (!range.collapsed && notArrowKey && key.length === 1)
  ) {
    selectWholeVariables(range, true);
    document.execCommand("delete", false, undefined);

    // Resetting color to neutral is necessary when the removed variable is at
    // the start of the formula.
    switchOffVariableColor(nonVariableFontColor);

    // Do not delete twice but do allow highlighted text to be replaced.
    if (key === "Backspace" || key === "Delete") {
      e.preventDefault();
    }

    return;
  }

  // Ensure that variable color does not continue for text right after a marker.
  if (
    range.collapsed &&
    range.startContainer.textContent &&
    range.startContainer.textContent[range.startOffset - 1] === "]"
  ) {
    switchOffVariableColor(nonVariableFontColor);
    return;
  }

  const isBracketKey = range.collapsed && (key === "[" || key === "]");

  // Allow entry in front of a variable at the start of the formula
  if (
    range.collapsed &&
    range.startContainer.textContent &&
    range.startContainer.textContent[0] === "[" &&
    range.startOffset === 0 &&
    notArrowKey &&
    !isBracketKey
  ) {
    switchOffVariableColor(nonVariableFontColor);
    return;
  }

  // Disallow manually entry of variables.
  if (
    (range.collapsed &&
      range.startContainer.textContent &&
      range.startContainer.textContent[0] === "[" &&
      notArrowKey) ||
    isBracketKey
  ) {
    e.preventDefault();
    return;
  }

  // Insert key by default.
}

function selectWholeVariables(
  range: Range,
  selectPriorVariable: boolean = false
) {
  // Ensure that text fragment selections are extended to cover complete variable names completely.

  if (!selectPriorVariable && range.collapsed) {
    const text = range.endContainer.textContent;
    // Caret is right after a variable
    if (text && range.endOffset === text.length && text.endsWith("]")) {
      return;
    }
  }

  if (
    range.startContainer.textContent &&
    range.startContainer.textContent[0] === "["
  ) {
    range.setStart(range.startContainer, 0);
  }

  if (
    range.endContainer.textContent &&
    range.endContainer.textContent[0] === "["
  ) {
    range.setEnd(
      range.endContainer,
      range.endContainer.textContent ? range.endContainer.textContent.length : 0
    );
  }
}

function switchOffVariableColor(nonVariableFontColor: string) {
  document.execCommand("styleWithCSS", false);
  document.execCommand("foreColor", false, nonVariableFontColor);
}

function handlePaste(e: ClipboardEvent, variableFontColor: string) {
  // Prevent unsafe HTML injection by reformating pasted formula explicitly
  if (!e.clipboardData) {
    return;
  }

  const text = formulaToHTML(
    e.clipboardData.getData("text/plain"),
    variableFontColor
  );
  document.execCommand("insertHTML", false, text);

  e.preventDefault();
}

function formulaToHTML(txt: string, variableFontColor: string): string {
  // Sanitize and standardize formatted text: the only tag are <span>s to set the color of variables.
  let inVariable = false;
  let leadingWhiteSpace = true;

  let html = "";
  for (let i = 0; i < txt.length; i++) {
    // Replace non-ASCII characters including invisible letters with spaces (to sanitize pasted input).
    if (txt.charCodeAt(i) > 127) {
      html += " ";
      continue;
    }

    const letter = txt.charAt(i);
    switch (letter) {
      case "[":
        if (inVariable) {
          html += "[";
        } else {
          inVariable = true;
          html += `<span style="color:${variableFontColor}">[`;
        }
        leadingWhiteSpace = false;
        break;

      case "]":
        if (inVariable) {
          inVariable = false;
          html += "]</span>";
        } else {
          html += "]";
        }
        leadingWhiteSpace = false;
        break;

      case "\n":
        html += "<br>";
        leadingWhiteSpace = true;
        break;

      case "\t":
        html += " ";
        break;

      case " ":
        html += leadingWhiteSpace ? "\u00A0" : " ";
        break;

      case "&":
        html += "&amp;";
        leadingWhiteSpace = false;
        break;

      case "<":
        html += "&lt;";
        leadingWhiteSpace = false;
        break;

      case '"':
        html += "&quot;";
        leadingWhiteSpace = false;
        break;

      default:
        html += letter;
        leadingWhiteSpace = false;
    }
  }

  if (inVariable) {
    html += "</span>";
  }

  return html;
}

// State variable to allow throttling variable inserts.
let lastVariableInsertTime = 0;

// When the active formula box loses focus, it losses it range selection / caret postion.
let prevRange: Range | null = null;

const storeSelection = () => {
  const selection = window.getSelection();
  if (!selection || selection.anchorNode == null) {
    return;
  }

  prevRange = selection.getRangeAt(0);
};

const restoreSelection = () => {
  if (prevRange) {
    const selection = window.getSelection();
    if (!selection || selection.anchorNode == null) {
      return;
    }

    const range = selection.getRangeAt(0);
    range.setStart(prevRange.startContainer, prevRange.startOffset);
    range.setEnd(prevRange.endContainer, prevRange.endOffset);
  }
};

/**
 * This function insert a variable in the active formula box.
 */
export const insertVariable = (
  name: string,
  variableFontColor: string = "#0000ff"
) => {
  const currentTime = new Date().getTime();
  if (currentTime - lastVariableInsertTime < 500) {
    return;
  }
  lastVariableInsertTime = currentTime;

  const selection = window.getSelection();
  if (!selection || selection.anchorNode == null) {
    return;
  }

  const range = selection.getRangeAt(0);
  if (!range) {
    return;
  }

  selectWholeVariables(range);

  const html = `<span style="color:${variableFontColor}">[${name}]</span>`;

  // Delay execution to allow focus to be reset on the active formula input area.
  setTimeout(() => {
    restoreSelection();
    document.execCommand("insertHTML", false, html);
    storeSelection();
  }, 0);
};

interface IProps {
  formulaText?: string;
  variableColor?: string;
  nonVariableColor?: string;
  readOnly?: boolean;
  isActive?: { state: boolean }; // This is passed as an object to allow forced rerender (and resetting focus)
  setFormula: React.Dispatch<SetStateAction<string>>;
  setActive: React.Dispatch<SetStateAction<void>>;
}

const FormulaInput = ({
  formulaText = "",
  variableColor = "#0000ff",
  nonVariableColor = "#000000",
  readOnly = false,
  isActive = { state: false },
  setFormula,
  setActive,
}: IProps) => {
  const formulaRef = useRef<HTMLDivElement | null>(null);

  // Only rerender when text has been changed in another way than by typing or pasting a variable.
  // This will avoid unnessary rendering and more importantly resetting of the caret position.
  useEffect(() => {
    if (formulaRef.current) {
      // Compare inner text rather than html because the HTML generated by the browser can
      // differ from the html produced by formulaToHTML

      if (formulaText !== formulaRef.current.innerText) {
        formulaRef.current.innerHTML = formulaToHTML(
          formulaText || "",
          variableColor
        );
      }
    }
  }, [formulaText, variableColor]);

  useEffect(() => {
    if (isActive.state && formulaRef.current) {
      formulaRef.current.focus();
    }
  }, [isActive]);

  const handleOnKeyDown = (e: any) => {
    formatVariablesKeyDown(e, nonVariableColor);
  };

  const handleOnKeyUp = (e: any) => {
    storeSelection();
  };

  const handleOnMouseUp = (e: any) => {
    const selection = window.getSelection();
    if (!selection || selection.anchorNode == null) {
      return;
    }

    selectWholeVariables(selection.getRangeAt(0));
    storeSelection();
  };

  const handleOnPaste = (e: any) => {
    handlePaste(e, variableColor);
  };

  const handleOnChange = () => {
    const innerText = formulaRef.current?.innerText || "";

    // Return formula value when modified
    if (setFormula) {
      setFormula(innerText);
    }
  };

  const handleOnFocus = () => {
    // Emit event that the div is in focus
    if (setActive) {
      setActive();
    }
  };

  return (
    <FormulaDiv
      data-active={isActive.state}
      ref={formulaRef}
      onKeyDown={handleOnKeyDown}
      onKeyUp={handleOnKeyUp}
      onMouseUp={handleOnMouseUp}
      onPaste={handleOnPaste}
      onInput={handleOnChange}
      onFocus={handleOnFocus}
      spellCheck="false"
      contentEditable={!readOnly}
      suppressContentEditableWarning
    />
  );
};

export default FormulaInput;
