import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import IntroVideo from "@/components/IntroVideo";

const WRAP = "mx-auto w-full max-w-7xl px-4 md:px-6 lg:px-8";

const FEATURES = [
  {
    title: "Keep every artwork in one place",
    body: "Add a photo and the details once. Your archive stays organised and ready for whatever the next exhibition needs.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden fill="none" stroke="currentColor" strokeWidth={1.75}>
        <rect x="3.5" y="7" width="17" height="13" rx="1" />
        <path d="M3.5 7 5.5 4h13l2 3" />
        <path d="M10 12h4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Publish your catalogue online",
    body: "Every exhibition gets its own web link. Send it to visitors, buyers, galleries or the press — no app to install, nothing to print.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden fill="none" stroke="currentColor" strokeWidth={1.75}>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M3.5 12h17M12 3.5c2.5 2.4 3.8 5.4 3.8 8.5s-1.3 6.1-3.8 8.5c-2.5-2.4-3.8-5.4-3.8-8.5S9.5 5.9 12 3.5Z" />
      </svg>
    ),
  },
  {
    title: "Download it as a PDF",
    body: "The same catalogue as a proper file. Email it, hand it out at the opening, or take it to a printer if you still want copies.",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden fill="none" stroke="currentColor" strokeWidth={1.75}>
        <path d="M12 3v11" strokeLinecap="round" />
        <path d="M6.5 9.5 12 15l5.5-5.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4 19h16" strokeLinecap="round" />
      </svg>
    ),
  },
];

const STEPS = [
  {
    label: "Step 1",
    title: "Create your free account",
    body: "Sign up with your email. It takes under a minute.",
  },
  {
    label: "Step 2",
    title: "Add your first artwork",
    body: "Upload a photo and fill in the details: title, size, medium, year, and what the piece is about. Do this once per artwork, ever.",
  },
  {
    label: "Step 3",
    title: "Build your catalogues",
    body: "Choose the works you want to show, put them in the order you like, and give the catalogue a title and dates.",
  },
  {
    label: "Step 4",
    title: "Publish and share",
    body: "ArteGO writes and lays out your catalogue. Read it through, change anything that doesn't sound like you, then share the link and download the PDF.",
  },
];

const COMPARISON = [
  { label: "Design and layout", usual: "RM500 – RM1,500", artego: "Free" },
  { label: "Time to finish", usual: "2 – 3 weeks", artego: "About 5 minutes" },
  { label: "A late change", usual: "Print it again", artego: "Publish it again" },
  { label: "Sharing it", usual: "Post or hand delivery", artego: "Send a link" },
];

const AUDIENCES = [
  {
    title: "Artists",
    lede: "You make the work. You shouldn't have to design the book.",
    body: "Keep a proper record of everything you've made, and produce a catalogue for your next show without paying a designer.",
    tags: "Solo shows and open calls · Art fairs and studio visits · Sending work to a gallery",
  },
  {
    title: "Curators & organisers",
    lede: "One catalogue for the whole show, not twenty email threads.",
    body: "Collect work from several artists, set the order, and publish one catalogue everyone can share the moment it's ready.",
    tags: "Group exhibitions · Student and graduate shows · Festivals and community projects",
  },
  {
    title: "Galleries",
    lede: "Every show gets a catalogue link that keeps working.",
    body: "A record collectors and writers can return to for years.",
    tags: null,
  },
];

const FAQS = [
  {
    q: "Do I need to know how to design?",
    a: "No. You fill in the details of your artwork, and ArteGO handles the layout.",
  },
  {
    q: "Who owns my artworks and photos?",
    a: "You do. They stay yours. You can delete them at any time.",
  },
  {
    q: "Can visitors read the catalogue without an account?",
    a: "Yes. Anyone with the link can open it. Only you need an ArteGO account.",
  },
  {
    q: "Can I still print it?",
    a: "Yes. The PDF is print-ready, so you can take it to any printer.",
  },
  {
    q: "Can I use it on my phone?",
    a: "Yes. ArteGO works in any browser, on a phone, tablet or computer.",
  },
  {
    q: "Is it really free to start?",
    a: "Yes. You can create an ArteGO account, add artworks and publish a catalogue without paying.",
  },
];

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className={`${WRAP} flex items-center justify-between py-4`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="ArteGO" className="h-8 w-auto" />
        <Link
          href="/login"
          className="flex min-h-11 items-center rounded border border-artego-black px-4 text-[15px] font-semibold text-artego-black focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-artego-blue"
        >
          Log In
        </Link>
      </header>

      {/* Hero */}
      <section className={`${WRAP} flex flex-col items-center gap-6 py-8 text-center md:py-12`}>
        <div className="w-full max-w-xl">
          <IntroVideo />
        </div>
        <h1 className="max-w-2xl text-3xl font-bold text-artego-black md:text-4xl">
          Upload once. Publish everywhere.
        </h1>
        <p className="max-w-xl text-base text-grey-900 md:text-lg">
          ArteGO keeps all your artworks in one place — then turns them into a finished
          exhibition catalogue. Share it online with a link, or download the PDF. No designer.
          No printing bill. No waiting.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/signup"
            className="flex min-h-11 items-center rounded bg-artego-red px-6 text-[15px] font-semibold text-artego-white focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-artego-blue"
          >
            Start your archive &rarr;
          </Link>
        </div>
        <p className="text-sm text-grey-600">
          Free to start &middot; No credit card &middot; Your first catalogue takes about five
          minutes
        </p>
      </section>

      {/* What is ArteGO? */}
      <section className="border-t border-grey-200 bg-grey-100 py-9">
        <div className={`${WRAP} flex flex-col gap-4 md:mx-auto md:max-w-3xl`}>
          <h2 className="text-xl font-semibold text-artego-black md:text-2xl">What is ArteGO?</h2>
          <p className="text-base text-grey-900">
            ArteGO is a website that helps artists, curators and galleries publish their
            exhibition artwork catalogues and artist directory.
          </p>
          <p className="text-base text-grey-900">
            You add each artwork once — a photo, the title, the size, the medium, the year, and
            the story behind it. That record stays yours, saved and organised.
          </p>
          <p className="text-base text-grey-900">
            When it&rsquo;s time for a show, ArteGO turns those records into a catalogue. Share
            it as a link anyone can open on their phone, and download the same catalogue as a
            PDF to email, hand out, or send to a printer.
          </p>
          <p className="text-base font-semibold text-artego-black">
            You never type the same details twice.
          </p>
        </div>
      </section>

      {/* What ArteGO does */}
      <section className="py-9">
        <div className={WRAP}>
          <h2 className="text-xl font-semibold text-artego-black md:text-2xl">What ArteGO does</h2>
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex flex-col gap-2 rounded border border-grey-200 p-4">
                <span className="text-artego-red-deep">{f.icon}</span>
                <h3 className="text-lg font-semibold text-artego-black">{f.title}</h3>
                <p className="text-sm text-grey-600">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How to get started */}
      <section className="border-t border-grey-200 bg-grey-100 py-9">
        <div className={WRAP}>
          <h2 className="text-xl font-semibold text-artego-black md:text-2xl">How to get started</h2>
          <p className="mt-1 text-base text-grey-600">Four steps from studio to show.</p>
          <ol className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
            {STEPS.map((s) => (
              <li key={s.label} className="flex flex-col gap-1 rounded border border-grey-200 bg-artego-white p-4">
                <span className="text-sm font-semibold uppercase tracking-wide text-artego-red-deep">
                  {s.label}
                </span>
                <h3 className="text-lg font-semibold text-artego-black">{s.title}</h3>
                <p className="text-sm text-grey-600">{s.body}</p>
              </li>
            ))}
          </ol>
          <p className="mt-6 text-sm text-grey-600">
            Start with one artwork. You can add the rest whenever you&rsquo;re ready.
          </p>
        </div>
      </section>

      {/* The catalogue */}
      <section className="py-9">
        <div className={`${WRAP} flex flex-col gap-4`}>
          <p className="text-sm font-semibold uppercase tracking-wide text-artego-red-deep">
            The catalogue
          </p>
          <h2 className="text-xl font-semibold text-artego-black md:text-2xl">
            The catalogue that used to take three weeks
          </h2>
          <p className="max-w-2xl text-base text-grey-900">
            ArteGO already has your artwork details, so it drafts the descriptions, sets the
            order, and lays out the pages for you. You read it through, edit anything that
            doesn&rsquo;t sound like you, and publish.
          </p>
          <p className="max-w-2xl text-base text-grey-900">
            You get two things at once: a link anyone can open, and a PDF you can download.
          </p>
          <p className="max-w-2xl text-base text-grey-900">
            Change your mind the day before opening? Fix it and publish again.
          </p>

          <div className="mt-2 overflow-x-auto">
            <table className="w-full min-w-[480px] border-collapse text-left">
              <thead>
                <tr className="border-b-2 border-artego-black">
                  <th scope="col" className="py-3 pr-4 text-sm font-semibold text-artego-black">
                    &nbsp;
                  </th>
                  <th scope="col" className="py-3 pr-4 text-sm font-semibold text-grey-600">
                    The usual way
                  </th>
                  <th scope="col" className="bg-grey-100 py-3 pl-4 text-sm font-semibold text-artego-black">
                    With ArteGO
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row) => (
                  <tr key={row.label} className="border-b border-grey-200">
                    <th scope="row" className="py-3 pr-4 text-sm font-semibold text-artego-black">
                      {row.label}
                    </th>
                    <td className="py-3 pr-4 text-sm text-grey-600">{row.usual}</td>
                    <td className="bg-grey-100 py-3 pl-4 text-sm font-semibold text-artego-black">
                      {row.artego}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section className="border-t border-grey-200 bg-grey-100 py-9">
        <div className={WRAP}>
          <h2 className="text-xl font-semibold text-artego-black md:text-2xl">Who it&rsquo;s for</h2>
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
            {AUDIENCES.map((a) => (
              <div key={a.title} className="flex flex-col gap-2 rounded border border-grey-200 bg-artego-white p-4">
                <h3 className="text-lg font-semibold text-artego-black">{a.title}</h3>
                <p className="text-sm font-semibold text-artego-black">{a.lede}</p>
                <p className="text-sm text-grey-600">{a.body}</p>
                {a.tags && <p className="mt-1 text-xs text-grey-600">{a.tags}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-9">
        <div className={`${WRAP} md:mx-auto md:max-w-3xl`}>
          <h2 className="text-xl font-semibold text-artego-black md:text-2xl">Common questions</h2>
          <div className="mt-4 flex flex-col">
            {FAQS.map((faq) => (
              <details key={faq.q} className="group border-b border-grey-200 py-4">
                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold text-artego-black [&::-webkit-details-marker]:hidden">
                  {faq.q}
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5 shrink-0 text-grey-600 transition-transform group-open:rotate-180"
                    aria-hidden
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.75}
                  >
                    <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </summary>
                <p className="mt-2 text-sm text-grey-600">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Closing */}
      <section className="border-t border-grey-200 bg-artego-black py-9">
        <div className={`${WRAP} flex flex-col items-center gap-4 text-center`}>
          <h2 className="text-xl font-semibold text-artego-white md:text-2xl">
            Your next exhibition starts with one upload
          </h2>
          <p className="text-sm text-grey-200">Free to start. Your archive stays yours.</p>
          <Link
            href="/signup"
            className="flex min-h-11 items-center rounded bg-artego-red px-6 text-[15px] font-semibold text-artego-white focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-artego-blue"
          >
            Start your archive &rarr;
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-grey-900 bg-artego-black py-6">
        <div className={`${WRAP} flex flex-col items-center gap-2 text-center`}>
          <p className="text-sm text-grey-200">
            A digital curatorial platform for artists, curators and galleries.
          </p>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-grey-400">
            art &middot; connects &middot; people
          </p>
          <p className="text-xs text-grey-400">&copy; 2026 ArteGO | kolumpoart publication</p>
        </div>
      </footer>
    </div>
  );
}
