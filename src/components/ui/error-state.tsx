export function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-3xl border border-red-200 bg-red-50 px-6 py-6 text-sm text-red-700">
      {message}
    </div>
  );
}
