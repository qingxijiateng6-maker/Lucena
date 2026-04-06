export default function HelpPage() {
  return (
    <section className="mx-auto max-w-4xl space-y-6 rounded-[32px] border border-[var(--line)] bg-white p-8 shadow-sm">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
          Help
        </p>
        <h1 className="mt-3 text-3xl font-semibold">操作説明</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <article className="rounded-[24px] border border-[var(--line)] bg-[var(--panel-soft)] p-5">
          <h2 className="text-lg font-semibold">Leggere</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
            本文を読みながら、画面下の「問題を表示」で問題パネルを開きます。全問回答後に一括採点し、そのまま復習画面へ進めます。
          </p>
        </article>
        <article className="rounded-[24px] border border-[var(--line)] bg-[var(--panel-soft)] p-5">
          <h2 className="text-lg font-semibold">Ascoltare</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
            音声は1回だけ再生できます。再生開始後に回答可能になり、採点後はスクリプトと解説付きの復習画面へ移動できます。
          </p>
        </article>
        <article className="rounded-[24px] border border-[var(--line)] bg-[var(--panel-soft)] p-5">
          <h2 className="text-lg font-semibold">ログイン</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
            ログインすると学習履歴、メモ、途中保存が有効になります。未ログインのままでも一覧閲覧と学習開始は可能です。
          </p>
        </article>
        <article className="rounded-[24px] border border-[var(--line)] bg-[var(--panel-soft)] p-5">
          <h2 className="text-lg font-semibold">復習</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
            Reading は文クリックで右ペインを切り替えます。Listening は上部の sticky プレイヤーと同期しながら左のスクリプトを追えます。
          </p>
        </article>
      </div>
    </section>
  );
}
