import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Starfield from '../hub/Starfield';
import LoadingScreen from '../hub/LoadingScreen';
import TitleCard from '../hub/TitleCard';
import ParticleText from '../hub/ParticleText';
import SlideUpText from '../hub/SlideUpText';
import GalaxyCanvas from '../hub/GalaxyCanvas';
import { useStore } from '../store';
import { useWarp } from '../nav/WarpDrive';
import { unlockAudio, whoosh } from '../lib/sfx';
import { usePageTitle } from '../lib/hooks';
import RollLink from '../lib/RollLink';
import UniverseCards from '../hub/UniverseCards';

const CoffeeScene = lazy(() => import('../hub/CoffeeScene'));
const NodeGraph = lazy(() => import('../hub/NodeGraph'));

// phones skip the heaviest toys: the 3D coffee cup (a ~900KB three.js chunk)
// never even downloads there
const MOBILE =
  typeof window !== 'undefined' &&
  window.matchMedia('(max-width: 767px)').matches;

/* [PLACEHOLDER: real Buy Me a Coffee / Ko-fi username & link] */
const BMC_URL = 'https://buymeacoffee.com/cooleditingx';
/* [PLACEHOLDER: email / form / social link] */
const CONTACT_EMAIL = 'duaanas0309@gmail.com';

const fadeUp = {
  initial: { opacity: 0, y: 32 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.3 },
  transition: { duration: 0.7, ease: 'easeOut' },
};

function RiseLetter({ progress, ch, start, accent }) {
  const y = useTransform(progress, [start, Math.min(start + 0.4, 1)], ['115%', '0%']);
  return (
    <motion.span
      style={{ y }}
      className={`inline-block will-change-transform ${accent ? 'text-[var(--gold)]' : ''}`}
    >
      {ch}
    </motion.span>
  );
}

/** One word of the giant footer name; letters rise with the curtain reveal. */
function RiseWord({ progress, text, from, step, className = '', style }) {
  return (
    <span
      className={`inline-flex overflow-hidden pb-[0.06em] -mb-[0.06em] ${className}`}
      style={style}
    >
      {text.split('').map((ch, i) => (
        <RiseLetter
          key={i}
          progress={progress}
          ch={ch}
          start={from + i * step}
          accent={ch === '.'}
        />
      ))}
    </span>
  );
}

/**
 * 5.8 + 5.9 — get in touch + footer. The section keeps the site's dark
 * space background (opaque, so it can act as the curtain); scrolling on
 * lifts it — rounded bottom corners — off the pinned full-screen footer,
 * where the giant name rises letter-by-letter with the scroll.
 */
function ContactFooter() {
  const revealRef = useRef(null);
  const [headerDone, setHeaderDone] = useState(false);

  // curtain progress: 0 = panel snapped in place, 1 = footer fully revealed
  const { scrollYProgress: reveal } = useScroll({
    target: revealRef,
    offset: ['start start', 'end end'],
  });

  // the sticky footer already sits "in" the viewport behind the curtain, so
  // the browser won't scroll when its links receive keyboard focus — pull the
  // curtain ourselves whenever focus lands inside the footer
  const revealOnFocus = () => {
    const el = revealRef.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY + el.offsetHeight - window.innerHeight;
    if (window.scrollY < top - 4) window.scrollTo({ top, behavior: 'smooth' });
  };

  return (
    <div ref={revealRef} className="relative snap-end">
      <section className="snap-start relative z-10 min-h-screen flex flex-col px-5 sm:px-8 md:pl-24 md:pr-8 pt-16 pb-10 bg-[var(--space-bg)] text-[var(--ink)] rounded-b-[3rem]">
        <ParticleText
          onDone={() => setHeaderDone(true)}
          doneAt={0.5}
          lines={() => [
            {
              text: 'GET IN TOUCH',
              fontFamily: '"Linux Biolinum", Georgia, serif',
              weight: 700,
              sizePx: 100, // fit rescales this to span the wrap width
              fit: true,
              lineHeight: 1.0,
            },
          ]}
          staticRender={
            <h2 className="font-biolinum font-bold leading-none text-center w-full text-[clamp(2.5rem,9vw,11rem)] text-[var(--ink)]">
              GET IN TOUCH
            </h2>
          }
        />
        {/* form on the left, the pitch on the right */}
        <div className="flex-1 grid md:grid-cols-2 gap-14 md:gap-20 items-start w-full pt-12 pb-14">
          <motion.form
            initial={{ opacity: 0, y: 32 }}
            animate={headerDone ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, ease: 'easeOut', delay: 0.3 }}
            onSubmit={(e) => {
              /* [PLACEHOLDER: wire to a real form backend — currently
                 composes a mailto draft in the visitor's mail client] */
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              const subject = encodeURIComponent(`Signal from ${f.get('name')}`);
              const body = encodeURIComponent(`${f.get('message')}\n\n— ${f.get('name')} (${f.get('email')})`);
              whoosh();
              window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
            }}
            className="w-full max-w-xl"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <label className="block">
                <span className="block font-mono text-[11px] tracking-[0.3em] text-[var(--ink-dim)] mb-2">NAME</span>
                <input
                  type="text"
                  name="name"
                  required
                  autoComplete="name"
                  className="w-full bg-[var(--violet)]/5 border border-[var(--violet)]/40 px-4 py-3 font-mono text-sm text-[var(--ink)] outline-none focus:border-[var(--cyan)] transition-colors"
                />
              </label>
              <label className="block">
                <span className="block font-mono text-[11px] tracking-[0.3em] text-[var(--ink-dim)] mb-2">EMAIL</span>
                <input
                  type="email"
                  name="email"
                  required
                  autoComplete="email"
                  className="w-full bg-[var(--violet)]/5 border border-[var(--violet)]/40 px-4 py-3 font-mono text-sm text-[var(--ink)] outline-none focus:border-[var(--cyan)] transition-colors"
                />
              </label>
            </div>
            <label className="block mt-5">
              <span className="block font-mono text-[11px] tracking-[0.3em] text-[var(--ink-dim)] mb-2">MESSAGE</span>
              <textarea
                name="message"
                required
                rows={6}
                className="w-full resize-none bg-[var(--violet)]/5 border border-[var(--violet)]/40 px-4 py-3 font-mono text-sm text-[var(--ink)] outline-none focus:border-[var(--cyan)] transition-colors"
              />
            </label>
            <button
              type="submit"
              className="w-full mt-6 font-mono text-sm tracking-[0.25em] border border-[var(--cyan)] text-[var(--cyan)] px-8 py-4 hover:bg-[var(--cyan)] hover:text-[#062a26] transition-colors"
            >
              TRANSMIT&nbsp;&nbsp;→
            </button>
          </motion.form>

          {/* no top padding: the text starts level with the NAME label */}
          <div className="flex flex-col gap-10 md:pl-4">
            <SlideUpText start={headerDone} className="text-lg md:text-xl max-w-xl">
              Do you want to bring your website idea to life? Let's talk, so it can shine as bright as the ideas behind it.
            </SlideUpText>
            <SlideUpText start={headerDone} className="text-lg md:text-xl max-w-xl">
              I'm available for freelance work and open to ambitious projects, wherever in the world they're coming from.
            </SlideUpText>
            <SlideUpText start={headerDone} className="text-lg md:text-xl max-w-xl">
              Whether it's a project, a question, or just to chat, feel free to drop a message
            </SlideUpText>
          </div>
        </div>
      </section>

      <footer
        onFocus={revealOnFocus}
        className="sticky bottom-0 h-screen bg-[#0b0a12] overflow-hidden flex flex-col px-5 sm:px-8 md:pl-24 md:pr-8 pt-10"
      >
        <GalaxyCanvas className="absolute inset-0" />
        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:gap-8 font-mono text-xs tracking-wider text-[var(--ink-dim)]">
          {/* socials on the left, display style */}
          <ul className="flex md:flex-1 flex-col items-start gap-1 font-display text-xl md:text-2xl text-[var(--ink)]">
            {/* [PLACEHOLDER: actual social links] */}
            <li><RollLink href="https://github.com/cooleditingx" className="hover:text-[var(--violet)] transition-colors">GitHub</RollLink></li>
            <li><RollLink href="https://www.linkedin.com/in/dua-anas/" className="hover:text-[var(--violet)] transition-colors">LinkedIn</RollLink></li>
            <li><RollLink href="https://www.youtube.com/@DuAcodes" className="hover:text-[var(--violet)] transition-colors">Youtube</RollLink></li>
            <li><RollLink href={`mailto:${CONTACT_EMAIL}`} className="hover:text-[var(--violet)] transition-colors">Email</RollLink></li>

          </ul>
          {/* email + credit on the right (stacked under the socials on phones) */}
          <div className="flex flex-row gap-1 md:text-right">
            <p> Designed & built by DuaAnas Ⓒ {new Date().getFullYear()}</p>
            {/* <RollLink href={`mailto:${CONTACT_EMAIL}`} className="hover:text-[var(--cyan)]">
              {CONTACT_EMAIL}
            </RollLink> */}
          </div>
        </div>
        <div className="flex-1" />
        <div className="relative z-10 flex items-end justify-between leading-[0.8] text-[var(--ink)]">
          <RiseWord
            progress={reveal}
            text="Dua"
            from={0.1}
            step={0.08}
            className="font-bold text-[clamp(4rem,16vw,15rem)]"
            style={{ fontFamily: '"Space Grotesk", sans-serif' }}
          />
          <RiseWord
            progress={reveal}
            text="Anas."
            from={0.34}
            step={0.07}
            className="font-biolinum italic text-[clamp(4rem,16vw,15rem)]"
          />
        </div>
      </footer>
    </div>
  );
}

export default function Hub() {
  usePageTitle(
    'Multiverse of Portfolio',
    "Step into the Multiverse of Portfolio — explore Dua Anas's front-end projects, hobbies and ideas across themed universes, then get in touch.",
    '/'
  );
  const explored = useStore((s) => s.explored);
  const setExplored = useStore((s) => s.setExplored);
  const warpTo = useWarp();
  // loading → ignite (chroma pulse on title) → title → explored
  const [phase, setPhase] = useState(explored ? 'explored' : 'loading');
  const [warping, setWarping] = useState(false);
  // gates the about paragraphs/button until the ABOUT header has condensed
  const [aboutHeaderDone, setAboutHeaderDone] = useState(false);

  // lock body scroll while the overlay is up
  useEffect(() => {
    const locked = phase !== 'explored';
    document.body.classList.toggle('no-scroll', locked);
    return () => document.body.classList.remove('no-scroll');
  }, [phase]);

  // section snap-scrolling, hub page only
  useEffect(() => {
    if (phase !== 'explored') return;
    document.documentElement.classList.add('snap-sections');
    return () => document.documentElement.classList.remove('snap-sections');
  }, [phase]);

  const handleLoaded = () => setPhase('ignite');
  useEffect(() => {
    if (phase !== 'ignite') return;
    // matches .chroma-pulse duration
    const t = setTimeout(() => setPhase('title'), 1200);
    return () => clearTimeout(t);
  }, [phase]);

  const handleExplore = () => {
    // first trusted gesture: unlock audio, then fire whoosh + warp
    unlockAudio();
    whoosh();
    setWarping(true);
    setTimeout(() => {
      setPhase('explored');
      setExplored(true);
    }, 850);
  };

  return (
    <div className="u-hub relative">
      <Starfield />

      {phase === 'loading' && <LoadingScreen onDone={handleLoaded} />}
      {(phase === 'ignite' || phase === 'title') && (
        <div className={warping ? 'warp-out fixed inset-0 z-[190]' : ''}>
          <TitleCard onExplore={handleExplore} ignited={phase === 'ignite'} />
        </div>
      )}

      {phase === 'explored' && (
      <div className="relative z-10">
        {/* 5.4 — hero (full viewport): green role line pinned top-left,
            then the giant intro type vertically centered, with the
            subheader at the left start of the name */}
        <section className="snap-start relative min-h-screen flex flex-col px-5 sm:px-8 md:pl-24 md:pr-8 pt-12 md:pt-16 pb-12 md:pb-24">
          <div className="w-full">
            <p className="font-mono text-sm md:text-base tracking-[0.35em] text-[var(--crt-green)]">
              Front End Developer
            </p>
          </div>
          {/* the type block condenses from particles; both lines are
              fitted edge-to-edge like the ABOUT header */}
          <div className="flex-1 flex items-center w-full">
            <div className="w-full">
              <ParticleText
                lines={() => [
                  {
                    text: 'Hi I Am',
                    fontFamily: '"Space Grotesk", sans-serif',
                    weight: 400,
                    sizePx: 100, // fit rescales this to half the wrap width
                    fit: 0.5,
                    lineHeight: 1.1,
                  },
                  {
                    // "Anas" styled to match the footer's italic "Anas."
                    runs: [
                      { text: 'Dua ', fontFamily: '"Linux Biolinum", Georgia, serif', weight: 700 },
                      { text: 'Anas', fontFamily: '"Linux Biolinum", Georgia, serif', weight: 400, italic: true },
                    ],
                    sizePx: 100, // fit rescales this to span the wrap width
                    fit: true,
                    lineHeight: 0.95,
                  },
                ]}
                staticRender={
                  <div className="w-full text-left">
                    <p className="font-aroma text-[8.5vw] leading-[1.1] text-[var(--ink)]">
                      Hi I Am!
                    </p>
                    <h1 className="font-biolinum text-[23vw] leading-[0.9] text-[var(--ink)]">
                      <span className="font-bold">Dua </span>
                      <span className="italic font-normal">Anas</span>
                    </h1>
                  </div>
                }
              />
            </div>
          </div>
          {/* phones: without snap paging, a small cue that there's more below */}
          <p
            aria-hidden="true"
            className="md:hidden absolute bottom-5 left-1/2 -translate-x-1/2 font-mono text-[10px] tracking-[0.4em] text-[var(--ink-dim)] animate-pulse"
          >
            SCROLL ↓
          </p>
        </section>

        {/* 5.5 — about + zero-g café (merged): ABOUT header at the same
            scale rhythm as the other sections, then an editorial split
            mirroring the contact panel — story + CTA on the left, the
            zero-g iced coffee floating in its own bounded column on the
            right — so everything, button included, fits one viewport */}
        <section className="snap-start px-5 sm:px-8 md:pl-24 md:pr-8 pt-12 md:pt-16 pb-12 md:min-h-screen flex flex-col">
          {/* header block pushed to the right; the type fits this wrapper */}
          <div className="relative z-10 w-[78%] md:w-[62%] ml-auto">
            <ParticleText
              onDone={() => setAboutHeaderDone(true)}
              doneAt={0.5}
              lines={() => [
                {
                  text: 'ABOUT',
                  fontFamily: '"Linux Biolinum", Georgia, serif',
                  weight: 700,
                  sizePx: 100, // fit rescales this to span the wrapper
                  fit: true,
                  lineHeight: 1.0,
                },
              ]}
              staticRender={
                <h2 className="font-biolinum font-bold leading-none text-center w-full text-[clamp(2.8rem,12.5vw,12.5rem)] text-[var(--ink)]">
                  ABOUT
                </h2>
              }
            />
            {/* little handwritten "Me" tucked under the end of ABOUT */}
            <motion.span
              aria-hidden="true"
              className="absolute -right-1 -bottom-1 md:-bottom-3 font-aroma text-[clamp(1.4rem,3.5vw,3.2rem)] leading-none text-[var(--gold)] -rotate-6"
              initial={{ opacity: 0, y: 12 }}
              animate={aboutHeaderDone ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
            >
              Me
            </motion.span>
          </div>
          {/* story on the left, coffee on the right, both vertically centered */}
          <div className="flex-1 grid md:grid-cols-2 gap-12 md:gap-16 items-center w-full pt-4">
            <div className="self-stretch flex flex-col justify-center gap-8 max-w-xl">
              <SlideUpText start={aboutHeaderDone} className="text-lg md:text-xl text-[var(--ink)]">
                Hi I'm a developer who takes your out-of-this-world ideas and makes them real. I'm currently on a gap year so I can advance my skills and save up for uni abroad, but that doesn't mean I build like a student.
              </SlideUpText>
              <SlideUpText start={aboutHeaderDone} className="text-lg md:text-xl text-[var(--ink)]">
                I'm passionate about making websites and apps that are functional and also genuinely fun to use. If that's something you're into too, let's connect. I'm currently looking for an internship or job, and I'm always open to freelance work if you want to bring your ideas to life.
              </SlideUpText>
              {/* <SlideUpText start={aboutHeaderDone} className="text-lg md:text-xl text-[var(--ink)]">
                If you want to help me reach my goal a little faster, buy me a
                coffee — and I'll add your name to my{' '}
                <span className="text-[var(--gold)] font-semibold">Dream Ladder</span>.
              </SlideUpText> */}
              <motion.div
                className="mt-2"
                initial={{ opacity: 0, y: 32 }}
                animate={aboutHeaderDone ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.7, ease: 'easeOut', delay: 0.9 }}
              >
                <a
                  href={BMC_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-explore inline-block text-sm md:text-base -ml-4"
                >
                  BUY ME COFFEE;)
                </a>
              </motion.div>
            </div>
            {/* the cup floats inside this bounded column, behind nothing.
                Desktop-only: on phones the 3D scene costs a ~900KB chunk +
                GPU time and the column stacks below the text anyway */}
            {!MOBILE && (
              <div className="relative w-full h-[40vh] md:h-[56vh]">
                <Suspense fallback={null}>
                  <CoffeeScene />
                </Suspense>
              </div>
            )}
          </div>
        </section>

        {/* 5.7 — universe navigator. Desktop: the drag-to-spin node-graph orb
            filling a full viewport section. Mobile: three big tappable cards
            instead — spin + tiny labels don't work under a thumb */}
        <section className="snap-start px-5 sm:px-8 md:pl-24 md:pr-8 pt-12 md:pt-16 pb-10 md:min-h-screen flex flex-col">
          <ParticleText
            lines={() => [
              {
                text: 'PICK A UNIVERSE',
                fontFamily: '"Linux Biolinum", Georgia, serif',
                weight: 700,
                sizePx: 100, // fit rescales this to span the wrap width
                fit: true,
                lineHeight: 1.0,
              },
            ]}
            staticRender={
              <h2 className="font-biolinum font-bold leading-none text-center w-full text-[clamp(2.5rem,9vw,11rem)] text-[var(--ink)]">
                PICK A UNIVERSE
              </h2>
            }
          />
          {MOBILE ? (
            <UniverseCards />
          ) : (
            <div className="flex-1 w-full mt-6 min-h-[380px] relative">
              <motion.div {...fadeUp} className="absolute inset-0">
                <Suspense fallback={<div className="h-full grid place-items-center font-mono text-xs text-[var(--ink-dim)]">charting stars…</div>}>
                  <NodeGraph />
                </Suspense>
              </motion.div>
            </div>
          )}
        </section>

        {/* 5.8 + 5.9 — get in touch panel + curtain-reveal footer */}
        <ContactFooter />
      </div>
      )}
    </div>
  );
}
