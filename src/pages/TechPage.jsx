import { useState } from 'react';
import { motion } from 'framer-motion';
import { crtOn, click } from '../lib/sfx';
import { unlockAudio } from '../lib/sfx';
import { usePageTitle, useJsonLd } from '../lib/hooks';
import { SITE_URL } from '../lib/site';

/* [PLACEHOLDER: real experience/project content] */
const EXPERIENCE = [
  { period: '2022 — NOW', role: 'Freelance Web Developer', detail: "I'm a CS student and full-stack developer working across React, JavaScript, Node.js, and SQL, with projects deployed on Vercel.  I'm focused on building complete, end-to-end products that are as thoughtful in design as they are solid in architecture." }
];

/* per project, optionally add `website` (live site) and/or `github` (repo).
   The WEBSITE / CODE buttons only render for links that are filled in —
   leave empty ('') to hide. */
const PROJECTS = [
  { name: 'Metier Artifice', subtitle: 'Client project, live e-commerce website', desc: 'Designed and built the full website for Metier Artifice, a resin art small business, including hosting and deployment. The site is a live storefront covering jewellery, wall clocks, trays, plaques, and a flower-preservation service, complete with product collections, an about section, and customer reviews. Includes easy to edit CMS collections for adding products', stack: 'Framer - SEO - Hosting', website: 'www.metierartifice.com', github: '' },
  { name: 'The Scent Chemist', subtitle: 'Client brand redesign', desc: "Brand redesign for Scent Chemist, a small independent perfume brand. Refreshed the site's visual identity and web presence for a client, showcasing product line and brand story.", stack: 'Vite · React . TDD', website: 'https://tsc-eight.vercel.app/', github: 'https://github.com/cooleditingx/TSC' },
  { name: 'Library of Alexandria', subtitle: 'Electron desktop app', desc: 'A desktop app built with Electron for tracking books read. Users can add books with title, author, and page count, then remove them from their shelf as desired. Designed with a custom hand-illustrated bookshelf/library interface.', stack: 'Electron - Javascript - HTML - CSS', website: '', github: '' },
  { name: 'Tweek To-Do', subtitle: 'Clone of a Web based To-Do app with the paid functionalities remade for a free version', desc: 'A feature-rich todo application inspired by Tweek.so, built with HTML, CSS, and JavaScript. Implements task management functionality with a polished user interface.', stack: 'HTML - CSS -JavaScript - TDD', website: 'https://cooleditingx.github.io/odin-to-do/', github: 'https://github.com/cooleditingx/odin-to-do'},
  { name: 'Battleship', subtitle: 'A valentine date inspired game with sushi boats', desc: 'Classic battleship inspired by the sushi game night with a twist. Built with HTML, CSS, and JavaScript, featuring an algorithmic computer opponent. Developed using test-driven development (TDD) methodology.', stack: 'HTML - CSS - JavaScript - TDD', website: 'https://cooleditingx.github.io/battleship/', github: 'https://github.com/cooleditingx/battleship'},
  { name: 'Portfolio v1', subtitle: 'First old portfolio website', desc: "My first personal portfolio website, built with HTML, CSS, and JavaScript to showcase my web development projects. Features a clean project grid with live demo and GitHub links, social integration, and a contact section. Served as my first live showcase of projects, skills, and socials before being redesigned into the current version you're viewing now.", stack: 'HTML - CSS - JavaScript - TDD', website: 'https://cooleditingx.github.io/portfolio/', github: 'https://github.com/cooleditingx/portfolio'},
];

const SKILLS = ['JavaScript', 'React', 'CSS', 'Node.js', 'Git', 'SQL', 'Python', 'Webpack', 'Jest', 'Vite', 'Electron','TDD', 'npm', 'HTML'];

/* JSON-LD: the project list as structured data, built from PROJECTS so it
   can never drift from what's on screen */
const TECH_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: "Dua Anas's projects",
  url: `${SITE_URL}/tech`,
  itemListElement: PROJECTS.map((p, i) => {
    const url = p.website && (p.website.startsWith('http') ? p.website : `https://${p.website}`);
    return {
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'CreativeWork',
        name: p.name,
        description: p.desc,
        ...(url ? { url } : {}),
        ...(p.github ? { sameAs: p.github } : {}),
        author: { '@id': `${SITE_URL}/#person` },
      },
    };
  }),
};

function Gate({ onPowerOn }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-10 px-6">
      <div className="crt-bezel p-6 md:p-10 w-[min(560px,92vw)]">
        <div className="crt-screen relative aspect-[4/3] grid place-items-center scanlines vignette overflow-hidden">
          <p className="font-mono text-xs text-[var(--crt-green-dim)] tracking-[0.3em] crt-flicker">
            NO SIGNAL
          </p>
        </div>
        <div className="flex items-center justify-between mt-5 px-2">
          <span className="font-mono text-[10px] text-[#6b6b60] tracking-widest">DUA-TRON 3000</span>
          <div className="flex items-center gap-3">
            <span className="power-led w-2 h-2 rounded-full bg-red-500 text-red-500" aria-hidden="true" />
            <button
              onClick={onPowerOn}
              className="font-mono text-xs tracking-[0.25em] bg-[#1c1c19] text-[var(--crt-green)] border border-[#3a3a34] rounded-full px-6 py-2.5 hover:bg-[#26261f] transition-colors"
            >
              ⏻ START
            </button>
          </div>
        </div>
      </div>
      <p className="font-mono text-xs text-[var(--crt-green-dim)] tracking-widest">
        UNIVERSE 01 · PRESS START TO BOOT
      </p>
    </div>
  );
}

function TermHeader({ children }) {
  return (
    <h2 className="font-mono text-lg md:text-xl text-glow mb-6 mt-16 first:mt-0">
      <span className="text-[var(--crt-green-dim)]">&gt;</span> {children}
      <span className="block-cursor ml-2" />
    </h2>
  );
}

export default function TechPage() {
  usePageTitle(
    'Tech — Multiverse of Portfolio',
    "Power on the CRT and browse Dua Anas's front-end projects — live demos, GitHub links and the stack behind each build, one screen at a time.",
    '/tech'
  );
  useJsonLd(TECH_JSON_LD);
  const [on, setOn] = useState(false);

  const powerOn = () => {
    unlockAudio();
    crtOn();
    setOn(true);
  };

  if (!on) return <div className="u-tech"><Gate onPowerOn={powerOn} /></div>;

  return (
    <div className="u-tech relative scanlines">
      <div className="crt-turning-on max-w-4xl mx-auto px-6 py-12 md:py-28">
        <p className="font-mono text-[11px] text-[var(--crt-green-dim)] tracking-widest mb-2">
          DUA-TRON 3000 · BOOT OK · UNIVERSE 01/04
        </p>
        <h1 className="font-mono font-bold text-3xl md:text-5xl text-glow mb-4">
          TECH_PROJECTS<span className="text-[var(--crt-green-dim)]">/</span>
        </h1>
        {/* <p className="text-[var(--crt-green-dim)] text-sm md:text-base max-w-xl">
          The atom that learned to type. Everything below runs on caffeine and
          stack overflow tabs.
        </p> */}

        <TermHeader>TECHNICAL_EXPERIENCE.log</TermHeader>
        <ul className="space-y-6">
          {EXPERIENCE.map((e, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="border-l-2 border-[var(--crt-green-dim)] pl-5"
            >
              <p className="font-mono text-xs text-[var(--crt-green-dim)]">{e.period}</p>
              <p className="font-mono font-bold text-base md:text-lg">{e.role}</p>
              <p className="text-sm text-[var(--crt-green)]/70 mt-1">{e.detail}</p>
            </motion.li>
          ))}
        </ul>

        <TermHeader>PROJECTS.dir</TermHeader>
        <div className="grid sm:grid-cols-2 gap-4">
          {PROJECTS.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="term-window rounded p-5 transition-shadow"
            >
              <div className="flex flex-col items-start gap-1 border-b border-[var(--crt-green-dim)]/40 pb-2 mb-3">
                {/* <span className="w-2 h-2 rounded-full bg-[var(--crt-green)]/60" /> */}
                <span className="font-mono text-sm font-bold truncate max-w-full">{p.name}</span>
                {p.subtitle && (
                  <span className='font-mono text-[11px] text-[var(--crt-green-dim)] tracking-wider'>{p.subtitle}</span>
                )}
              </div>
              <p className="text-sm text-[var(--crt-green)]/75 mb-3">{p.desc}</p>
              <p className="font-mono text-[11px] text-[var(--crt-green-dim)] tracking-wider">{p.stack}</p>
              {(p.website || p.github) && (
                <div className="flex flex-wrap gap-2.5 mt-4">
                  {p.website && (
                    <a
                      href={p.website}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => click()}
                      className="font-mono text-[11px] tracking-[0.2em] border border-[var(--crt-green-dim)] rounded px-4 py-2.5 text-[var(--crt-green)] hover:bg-[var(--crt-green)] hover:text-black transition-colors"
                    >
                      WEBSITE ↗
                    </a>
                  )}
                  {p.github && (
                    <a
                      href={p.github}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => click()}
                      className="font-mono text-[11px] tracking-[0.2em] border border-[var(--crt-green-dim)] rounded px-4 py-2.5 text-[var(--crt-green)] hover:bg-[var(--crt-green)] hover:text-black transition-colors"
                    >
                      CODE ↗
                    </a>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </div>

        <TermHeader>SKILLS.sys</TermHeader>
        <div className="flex flex-wrap gap-2.5">
          {SKILLS.map((s) => (
            <span key={s} className="font-mono text-xs border border-[var(--crt-green-dim)] rounded-full px-4 py-1.5 text-[var(--crt-green)]/85">
              {s}
            </span>
          ))}
        </div>

        <p className="font-mono text-[11px] text-[var(--crt-green-dim)] tracking-widest mt-24">
          &gt; END OF TAPE — use the TARS (robot) icon to jump universes
        </p>
      </div>
    </div>
  );
}
