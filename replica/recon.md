# Recon map: vanhuy.dev + portfolio.vanhuy.dev

Clean-room: this map records layout and UX patterns only. No code, copy,
photos, logo or quotes from the original go into the clone. Reference
screenshots were viewed in the browser on 2026-10-27 and are not kept in the
repo.

## Scope

- **App, platform:** a developer's personal site, web (desktop + phone).
- **Slice:** the home page (hero + list under it), the projects grid, the
  about page, and the one-page portfolio. Blog posts, tags and search are out:
  the owner has no posts yet.
- **For:** a personal portfolio template. Vietnamese first, English and Japanese.
  Page copy, skills and projects in this fork are sample placeholders.

## Sources

| source | url | what it gave |
| --- | --- | --- |
| home | https://vanhuy.dev/ | header, hero, "Latest" list, footer |
| projects | https://vanhuy.dev/projects | 2-column card grid, 16:9 image, "Learn more →" |
| about | https://vanhuy.dev/about | centred profile card, social icons, bio |
| portfolio | https://portfolio.vanhuy.dev/ | one-page portfolio: hero, featured rows, other grid, about, skills, contact |
| 404 | https://vanhuy.dev/portfolio | big "404" + message + back button |

## Screens

| ID | screen | route | purpose | key components | states seen |
| --- | --- | --- | --- | --- | --- |
| S01 | Home | `/` | who I am, what I made | header, hero (role label, H1, tagline with 「」 and `//` comment, two code-style buttons, round avatar), section title + intro, list rows (date, title, tags, summary, "→" link), footer | filled, dark, phone |
| S02 | Projects | `/projects` | all projects as cards | page title + subtitle, divider, card grid (16:9 image, title, text, link) | filled |
| S03 | About | `/about` | profile | centred avatar, name, role, company, icon row, bio paragraphs | filled |
| S04 | Portfolio | `portfolio.` subdomain | hiring view | signature-style logo, nav (Work, About, Resume), dark toggle, hero with photo, "currently working with" 2-col list, featured project rows alternating image side, tech chips, "Live Demo" button, other-projects grid, about + education/experience, skills groups, "Say hi" contact, quote footer | filled, scroll reveal animation |
| S05 | 404 | any unknown route | recover | big number, message, back button | — |

## Flows

```
F01 Visitor sees the work
    S01 home -> scroll to the list -> click a project -> live site (new tab)
    happy path: 1 scroll + 1 click
F02 Recruiter reads the portfolio
    S01 header "Portfolio" -> S04 -> featured project -> "Live Demo"
    happy path: 2 clicks
F03 Visitor gets in touch
    any page footer mail icon, or S04 "Say hi" -> mail client
F04 Visitor switches theme / language
    header toggle -> page re-renders, choice remembered
```

## Components

| component | variants | states | screens |
| --- | --- | --- | --- |
| Header | blog (logo + name + links + icons), portfolio (signature + links) | sticky, mobile menu | S01-S05 |
| Code button | filled gradient, outlined | hover, focus | S01 |
| List row | — | hover | S01 |
| Tag chip | text-only (blog), pill (portfolio) | — | S01, S04 |
| Project card | image + text | hover | S02 |
| Featured row | image left / right | reveal on scroll | S04 |
| Icon row | mail, GitHub, socials | hover | S01, S03, S04 |
| Theme toggle | sun / moon | — | all |
| Language switch | VI / EN / JA | — | all (new) |
| Footer | name • © year • site, quote | — | all |

## Data model (inferred)

```
Profile   name, role, tagline, bio[], email, github, skills{group: [name]}
          evidence: S01 hero, S03, S04 about/skills   confidence: high
Project   slug, name, period, summary, highlights[], stack[], url, image
          evidence: S02 cards, S04 featured rows      confidence: high
```

Static site: these live in `assets/data.js`, one object per language.

## Cannot be cloned (skip)

- The owner's photo, logo mark, name, quotes, résumé PDF, project screenshots.
- Blog posts, tags, search, newsletter: no content to show yet.

## Size

5 screens, 4 flows, 2 entities, no backend. Hard parts: three languages
without a build step, dark mode without a flash, phone layout. Size: **S**.
