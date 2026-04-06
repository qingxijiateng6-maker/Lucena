export function LoadingState({ label = "読み込み中..." }: { label?: string }) {
  return (
    <div className="rounded-3xl border border-[var(--line)] bg-white px-6 py-10 text-center text-sm text-[var(--muted)]">
      {label}
    </div>
  );
}
