export function Toggle({
  checked,
  busy,
  label,
  onChange,
}: {
  checked: boolean
  busy: boolean
  label: string
  onChange: () => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={busy}
      onClick={onChange}
      className={`relative inline-flex h-[22px] w-10 shrink-0 items-center rounded-full border-0 p-0.5 transition duration-200 active:scale-95 disabled:cursor-wait disabled:opacity-70 ${checked ? 'bg-primary shadow-[0_0_0_1px_#00A6E666,0_0_12px_#00A6E640]' : 'bg-line'}`}
    >
      <span
        className={`flex size-[18px] items-center justify-center rounded-full bg-base-content transition-transform duration-200 ${checked ? 'translate-x-[18px]' : 'translate-x-0'}`}
      >
        {busy && (
          <span className="loading loading-spinner size-2.5 text-primary" />
        )}
      </span>
    </button>
  )
}
