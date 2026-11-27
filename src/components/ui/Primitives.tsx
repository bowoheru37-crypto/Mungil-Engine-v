import React, { useEffect, useRef } from 'react';

export const Card: React.FC<{
  children: React.ReactNode;
  className?: string;
  highlighted?: boolean;
}> = ({ children, className = '', highlighted = false }) => (
  <section
    className={`rounded-2xl border p-3.5 transition-colors ${className}`}
    style={{
      backgroundColor: highlighted ? 'color-mix(in srgb, var(--me-primary) 12%, var(--me-surface))' : 'var(--me-surface)',
      borderColor: highlighted ? 'color-mix(in srgb, var(--me-primary) 45%, var(--me-border))' : 'var(--me-border)'
    }}
  >
    {children}
  </section>
);

export type ButtonVariant = 'primary' | 'tonal' | 'outline' | 'ghost' | 'danger';

export const ActionButton: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
    fullWidth?: boolean;
  }
> = ({ variant = 'primary', fullWidth = false, className = '', children, disabled, style, ...rest }) => {
  const palette: Record<ButtonVariant, React.CSSProperties> = {
    primary: {
      backgroundColor: 'var(--me-primary)',
      color: 'var(--me-on-primary)',
      borderColor: 'transparent'
    },
    tonal: {
      backgroundColor: 'var(--me-surface-variant)',
      color: 'var(--me-text)',
      borderColor: 'var(--me-border)'
    },
    outline: {
      backgroundColor: 'transparent',
      color: 'var(--me-text)',
      borderColor: 'var(--me-border)'
    },
    ghost: {
      backgroundColor: 'transparent',
      color: 'var(--me-primary)',
      borderColor: 'transparent'
    },
    danger: {
      backgroundColor: 'var(--me-danger)',
      color: '#ffffff',
      borderColor: 'transparent'
    }
  };

  return (
    <button
      type="button"
      disabled={disabled}
      className={`inline-flex min-h-12 cursor-pointer items-center justify-center gap-1.5 rounded-xl border px-3.5 py-2 text-sm font-semibold transition-opacity hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 ${
        fullWidth ? 'w-full' : ''
      } ${className}`}
      style={{ ...palette[variant], ...style }}
      {...rest}
    >
      {children}
    </button>
  );
};

export const FilterChip: React.FC<{
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
  title?: string;
}> = ({ selected, onClick, children, className = '', title }) => (
  <button
    type="button"
    title={title}
    onClick={onClick}
    className={`inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all active:scale-[0.98] ${className}`}
    style={{
      backgroundColor: selected
        ? 'color-mix(in srgb, var(--me-primary) 22%, var(--me-surface-variant))'
        : 'var(--me-surface-variant)',
      borderColor: selected ? 'var(--me-primary)' : 'var(--me-border)',
      color: selected ? 'var(--me-primary)' : 'var(--me-text)'
    }}
  >
    {children}
  </button>
);

export const SwitchRow: React.FC<{
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  subtitle?: string;
}> = ({ label, checked, onChange, subtitle }) => (
  <label className="flex min-h-12 cursor-pointer items-center justify-between gap-3 py-1 select-none">
    <div>
      <div className="text-sm font-medium" style={{ color: 'var(--me-text)' }}>
        {label}
      </div>
      {subtitle && (
        <div className="text-xs" style={{ color: 'var(--me-text-muted)' }}>
          {subtitle}
        </div>
      )}
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border transition-colors"
      style={{
        backgroundColor: checked ? 'var(--me-primary)' : 'var(--me-surface-variant)',
        borderColor: checked ? 'var(--me-primary)' : 'var(--me-border)'
      }}
    >
      <span
        className={`inline-block h-5 w-5 rounded-full transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
        style={{ backgroundColor: checked ? 'var(--me-on-primary)' : 'var(--me-text-muted)' }}
      />
    </button>
  </label>
);

export const SliderField: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}> = ({ label, value, min, max, step = 1, onChange }) => (
  <div className="space-y-1">
    <div className="text-xs font-medium" style={{ color: 'var(--me-text-muted)' }}>
      {label}
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="h-2 w-full cursor-pointer accent-sky-400"
    />
  </div>
);

export const TextField: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  mono?: boolean;
  className?: string;
}> = ({ label, value, onChange, placeholder, multiline = false, rows = 3, mono = false, className = '' }) => (
  <label className={`block space-y-1 ${className}`}>
    <span className="block text-xs font-medium" style={{ color: 'var(--me-text-muted)' }}>
      {label}
    </span>
    {multiline ? (
      <textarea
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-400/50 ${
          mono ? 'font-mono-code text-xs' : ''
        }`}
        style={{
          backgroundColor: 'var(--me-bg)',
          borderColor: 'var(--me-border)',
          color: 'var(--me-text)'
        }}
      />
    ) : (
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`min-h-11 w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-400/50 ${
          mono ? 'font-mono-code text-xs' : ''
        }`}
        style={{
          backgroundColor: 'var(--me-bg)',
          borderColor: 'var(--me-border)',
          color: 'var(--me-text)'
        }}
      />
    )}
  </label>
);

export const HiDpiCanvas: React.FC<{
  className?: string;
  dprCap?: number;
  onDraw: (ctx: CanvasRenderingContext2D, width: number, height: number) => void;
  onPointerDown?: (e: React.PointerEvent<HTMLCanvasElement>, rect: DOMRect) => void;
  onPointerMove?: (e: React.PointerEvent<HTMLCanvasElement>, rect: DOMRect) => void;
  onPointerUp?: (e: React.PointerEvent<HTMLCanvasElement>, rect: DOMRect) => void;
}> = ({ className = '', dprCap = 2, onDraw, onPointerDown, onPointerMove, onPointerUp }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawRef = useRef(onDraw);
  drawRef.current = onDraw;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const render = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return;
      const dpr = Math.min(window.devicePixelRatio || 1, dprCap);
      const targetW = Math.round(rect.width * dpr);
      const targetH = Math.round(rect.height * dpr);
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawRef.current(ctx, rect.width, rect.height);
      ctx.restore();
    };
    render();
    const obs = new ResizeObserver(render);
    obs.observe(canvas);
    return () => obs.disconnect();
  });

  return (
    <canvas
      ref={canvasRef}
      className={className}
      onPointerDown={
        onPointerDown
          ? (e) => onPointerDown(e, e.currentTarget.getBoundingClientRect())
          : undefined
      }
      onPointerMove={
        onPointerMove
          ? (e) => onPointerMove(e, e.currentTarget.getBoundingClientRect())
          : undefined
      }
      onPointerUp={
        onPointerUp
          ? (e) => onPointerUp(e, e.currentTarget.getBoundingClientRect())
          : undefined
      }
      onPointerCancel={
        onPointerUp
          ? (e) => onPointerUp(e, e.currentTarget.getBoundingClientRect())
          : undefined
      }
    />
  );
};
