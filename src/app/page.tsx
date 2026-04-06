import Image from "next/image";
import Link from "next/link";

const cards = [
  {
    href: "/leggere",
    label: "Leggere",
    image: "/illustrations/home/leggere.svg",
  },
  {
    href: "/ascoltare",
    label: "Ascoltare",
    image: "/illustrations/home/ascoltare.svg",
  },
];

export default function HomePage() {
  return (
    <section className="flex flex-1 flex-col items-center justify-center">
      <div className="grid w-full max-w-4xl gap-6 md:grid-cols-2">
        {cards.map((card) => (
          <Link
            key={card.href}
            className="group rounded-[32px] border border-[var(--line)] bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            href={card.href}
          >
            <div className="relative h-80 overflow-hidden rounded-[24px] bg-[var(--accent)]">
              <Image
                alt={card.label}
                className="object-cover transition duration-300 group-hover:scale-[1.02]"
                fill
                priority
                sizes="(min-width: 768px) 50vw, 100vw"
                src={card.image}
              />
            </div>
            <div className="pt-5 text-center text-2xl font-semibold tracking-[0.04em]">
              {card.label}
            </div>
          </Link>
        ))}
      </div>

      <Link
        className="mt-10 rounded-full border border-[var(--line)] bg-white px-5 py-3 text-sm font-medium shadow-sm"
        href="/help"
      >
        操作説明を見る
      </Link>
    </section>
  );
}
