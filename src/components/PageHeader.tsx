import type { ReactNode } from 'react';

export function PageHeader({
  eyebrow,
  title,
  description,
  align = 'left',
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: 'left' | 'center';
}) {
  return (
    <header
      className={`mb-10 max-w-2xl ${align === 'center' ? 'mx-auto text-center' : ''}`}
    >
      {eyebrow ? <p className="brand-eyebrow">{eyebrow}</p> : null}
      <h1
        className={`brand-title text-4xl sm:text-5xl ${eyebrow ? 'mt-3' : ''}`}
      >
        {title}
      </h1>
      {description ? (
        <div className={`brand-lede ${eyebrow || title ? 'mt-4' : ''}`}>
          {description}
        </div>
      ) : null}
    </header>
  );
}
