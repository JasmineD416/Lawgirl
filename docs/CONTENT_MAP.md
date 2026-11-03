# Website outline and content map

| URL | Content / intended action |
|---|---|
| `/` | Law Girl education/media introduction; books, podcast, articles and monthly signup |
| `/about` | Jasmine Daya biography and accurately qualified licensing wording |
| `/podcast` | 32-episode source-feed archive, season/search filters and audio |
| `/books` | Law Girl Series and Private Lender Series; formats, retailer links and direct e-book checkout |
| `/articles` | Published articles; topic/search filters and original sources |
| `/articles/:slug` | Original article paragraphs published through Owner Studio |
| `/media` | Relevant legal interviews and news appearances |
| `/media/:slug` | Native media description if owner publishes paragraph content |
| `/lowdown` | Law Girl's Lowdown; focused LinkedIn publication |
| `/newsletter` | Broader Law Girl’s Monthly Rundown email newsletter and confirmed signup |
| `/newsletter/confirm` | Explicit subscription confirmation |
| `/newsletter/first-look` | Labelled editorial draft of the first issue |
| `/blog` | Law Girl blog archive |
| `/blog/:slug` | Original native blog post |
| `/education` | Short lessons and course catalog |
| `/law-school` | Law Girl’s Law School: paid courses, enrolment through Stripe Checkout |
| `/education/:course` | Published versioned course, knowledge checks and certificate claim |
| `/certificate/:id` | Signed-in owner's certificate and printable PDF view |
| `/stack` | The Private Lender Stack and all listed products |
| `/stack/:product` | Product overview and configured external URL |
| `/jdco` | Jasmine Daya & Co overview and firm link |
| `/geraci` | Geraci LLP overview and firm link |
| `/cbpla` | Cross-Border Private Lenders Association overview and association link |
| `/signup`, `/signin` | Create a Law Girl account; sign in |
| `/account` | Name, password, email confirmation, sign out |
| `/forgot-password`, `/reset-password`, `/verify-email` | Account recovery and email confirmation links |
| `/library` | Signed-in purchaser's e-books and certificates |
| `/admin` | Owner publishing and operations studio |
| `/privacy`, `/terms` | Editable-in-source policy drafts pending final approval |
| `/unsubscribe` | Newsletter preference action |
| `/sitemap.xml`, `/robots.txt` | Search metadata with indexing disabled until approved |

Source copy is in `app/data.ts`, `app/site.tsx`, the episode JSON and Owner Studio records. The live navigation and content schemas are implemented. Existing legal articles link to their original dated publications rather than being rewritten as current legal advice. The paperback buttons initially use labelled Amazon searches where an exact verified paperback edition URL was not supplied. New owner-managed content can replace those links without code changes.
