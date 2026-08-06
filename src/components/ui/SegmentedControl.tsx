export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  name: string;
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

/** SegmentedControl — radio-group tab switcher (Board/Table, Customers/Suppliers/Products). */
export function SegmentedControl<T extends string>({ name, options, value, onChange }: SegmentedControlProps<T>) {
  return (
    <div className="inline-flex overflow-hidden border border-[var(--color-divider)] rounded-[var(--radius-md)]">
      {options.map((opt, i) => {
        const active = opt.value === value;
        return (
          <label
            key={opt.value}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] cursor-pointer ${
              i > 0 ? "border-l border-[var(--color-divider)]" : ""
            } ${active ? "text-[var(--color-accent)] shadow-[inset_0_0_0_1px_var(--color-accent)]" : "hover:bg-[color-mix(in_srgb,var(--color-text)_7%,transparent)]"}`}
          >
            <input
              type="radio"
              name={name}
              className="sr-only"
              checked={active}
              onChange={() => onChange(opt.value)}
            />
            {opt.label}
          </label>
        );
      })}
    </div>
  );
}
