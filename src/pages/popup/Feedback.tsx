import { useEffect, useId, useRef, useState } from "react";
import {
  FEEDBACK_TYPES,
  openFeedbackEmail,
  type FeedbackType,
} from "@src/shared/feedback";

interface FeedbackDialogProps {
  onClose: () => void;
}

const FOCUSABLE =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

const FeedbackDialog = ({ onClose }: FeedbackDialogProps) => {
  const [type, setType] = useState<FeedbackType>(FEEDBACK_TYPES[0]);
  const [message, setMessage] = useState("");
  const titleId = useId();
  const typeId = useId();
  const messageId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable =
        dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (!focusable || focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    dialogRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus?.();
    };
  }, []);

  const send = () => {
    const text = message.trim();
    if (!text) return;
    openFeedbackEmail({ type, message: text });
    onClose();
  };

  return (
    <div className="feedback-overlay" onMouseDown={onClose} role="presentation">
      <div
        className="feedback-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        ref={dialogRef}
        tabIndex={-1}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="feedback-header">
          <div className="feedback-heading">
            <h2 id={titleId}>Send feedback</h2>
            <p>Opens your email app with the message ready to send.</p>
          </div>
          <button
            type="button"
            className="feedback-close"
            aria-label="Close feedback"
            onClick={onClose}
          >
            ×
          </button>
        </header>

        <form
          className="feedback-form"
          onSubmit={(event) => {
            event.preventDefault();
            send();
          }}
        >
          <label className="feedback-field" htmlFor={typeId}>
            <span>Type of feedback</span>
            <select
              id={typeId}
              value={type}
              onChange={(event) => setType(event.target.value as FeedbackType)}
            >
              {FEEDBACK_TYPES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="feedback-field" htmlFor={messageId}>
            <span>Your message</span>
            <textarea
              id={messageId}
              value={message}
              rows={5}
              placeholder="Tell us what happened or what you would like to see…"
              onChange={(event) => setMessage(event.target.value)}
            />
          </label>

          <p className="feedback-hint">
            Want to include a screenshot? Attach it in your email app once it
            opens.
          </p>

          <div className="feedback-actions">
            <button type="button" className="feedback-cancel" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="feedback-send"
              disabled={!message.trim()}
            >
              Send feedback
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeedbackDialog;
