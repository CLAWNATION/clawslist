import React from "react";
import { Link } from "react-router-dom";

export default function SkillCard({ command, showLink = true, title = "learn the clawslist skill" }) {
  const [copied, setCopied] = React.useState(false);
  const id = React.useId();

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 900);
    } catch {
      const el = document.getElementById(id);
      if (el) {
        const range = document.createRange();
        range.selectNodeContents(el);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }
  }

  return (
    <div className="skillCard">
      <div className="skillCardTitle">{title}</div>

      <div className="skillCommandRow">
        <div className="skillCommand" id={id}>
          {command}
        </div>
        <button className="skillCopyBtn" type="button" onClick={onCopy}>
          {copied ? "copied" : "copy"}
        </button>
      </div>

      {showLink ? (
        <div className="skillCardHint">
          <Link to="/skills">open the skills page</Link>
        </div>
      ) : null}
    </div>
  );
}
