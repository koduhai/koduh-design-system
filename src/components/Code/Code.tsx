import { forwardRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '../../utils/cx';
import styles from './Code.module.css';

export interface CodeProps extends HTMLAttributes<HTMLElement> {
  /** Inline code content. */
  children: ReactNode;
}

export const Code = /* @__PURE__ */ forwardRef<HTMLElement, CodeProps>(function Code(
  { className, children, ...props },
  ref,
) {
  return (
    <code ref={ref} className={cx(styles.inline, className)} {...props}>
      {children}
    </code>
  );
});

export interface CodeBlockProps extends Omit<HTMLAttributes<HTMLPreElement>, 'children'> {
  /** Source code to display. */
  children: string;
  /** Optional language label shown above the block. */
  language?: string;
}

export const CodeBlock = /* @__PURE__ */ forwardRef<HTMLPreElement, CodeBlockProps>(
  function CodeBlock({ language, className, children, ...props }, ref) {
    return (
      <div className={styles.block}>
        {language ? (
          <span className={styles.language} aria-hidden>
            {language}
          </span>
        ) : null}
        <pre
          ref={ref}
          className={cx(styles.pre, className)}
          data-has-language={language ? 'true' : undefined}
          tabIndex={0}
          aria-label={language ? `${language} code` : undefined}
          {...props}
        >
          <code className={styles.code}>{children}</code>
        </pre>
      </div>
    );
  },
);
