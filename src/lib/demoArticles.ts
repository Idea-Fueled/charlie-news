export interface DemoArticle {
  id: string | number
  headline: string
  slug: string
  summary: string
  seoDescription?: string
  bodyText?: string[]
  publishedAt: string
  section: {
    name: string
    slug: string
  }
  image: {
    url: string
    source: 'Unsplash' | 'Pexels'
  }
  imageAlt: string
  imageCredit: {
    name: string
    link: string
  }
}

export const DEMO_ARTICLES: DemoArticle[] = [
  {
    id: 'demo-1',
    headline: 'Sydney Heritage Terraces Undergo Radical Green Revamps in 2026',
    slug: 'sydney-heritage-terraces-green-revamps',
    summary:
      'Architects and homeowners across Paddington, Glebe, and Balmain are fusing 19th-century facade preservation with cutting-edge passive solar design and carbon-neutral retrofits.',
    publishedAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    section: {
      name: 'Renovation',
      slug: 'renovation',
    },
    image: {
      url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
      source: 'Unsplash',
    },
    imageAlt: 'Restored Victorian terrace house in Sydney with modern rear extension',
    imageCredit: {
      name: 'Tom Thurnell',
      link: 'https://unsplash.com',
    },
    bodyText: [
      'Across Sydney’s inner-city suburbs, historic Victorian and Edwardian terraces are undergoing unprecedented transformations. Local councils are increasingly approving sympathetic modern additions that prioritize energy efficiency while honoring heritage streetscapes.',
      'Architect Clare McAllister notes that homeowners are rejecting dark, drafty interiors in favor of double-height rear voids, double-glazed steel-framed doors, and integrated solar tile solutions. "The challenge has always been introducing natural light into long, narrow footprints without destroying original plasterwork or brickwork," McAllister explains.',
      'With new NSW energy performance standards mandating higher NatHERS ratings on major renovations, clever insulation methods and cross-ventilation courtyards have transitioned from luxury options to baseline necessities.',
      'The average budget for comprehensive terrace restorations in inner-Sydney currently sits between $450,000 and $850,000, with sustainable upgrades delivering up to 40% reductions in ongoing heating and cooling expenses.',
    ],
  },
  {
    id: 'demo-2',
    headline: 'RBA Holds Cash Rate: What It Means for Spring Buyers and Refinancers',
    slug: 'rba-holds-cash-rate-buyers-guide',
    summary:
      'The Reserve Bank of Australia has kept rates steady this quarter, signaling balanced economic growth as auction clearance rates show renewed resilience in capital cities.',
    publishedAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    section: {
      name: 'Politics',
      slug: 'politics',
    },
    image: {
      url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186f5f7?auto=format&fit=crop&w=1200&q=80',
      source: 'Unsplash',
    },
    imageAlt: 'Australian financial district modern architecture',
    imageCredit: {
      name: 'Dan Freeman',
      link: 'https://unsplash.com',
    },
    bodyText: [
      'In its latest monetary policy board meeting in Sydney, the Reserve Bank of Australia decided to maintain the official cash rate, citing steady progress on core inflation and stable employment figures.',
      'The decision provides much-needed predictability for Australian mortgage holders who have navigated sharp adjustments over the past 24 months. Bank economists anticipate that fixed-rate offerings will remain competitive over the remainder of the year.',
      'According to leading market analysts, buyer sentiment in Sydney and Melbourne has rebounded, with weekend auction clearance rates hovering consistently above 68 percent.',
      'Prospective buyers are advised to review pre-approvals carefully, as lending buffers of 300 basis points remain firmly in place across major commercial lenders.',
    ],
  },
  {
    id: 'demo-3',
    headline: 'First Home Buyer Grants: State Governments Revamp Price Thresholds',
    slug: 'first-home-buyer-grants-threshold-changes',
    summary:
      'New housing policy measures across NSW, Victoria, and Queensland increase property cap limits, bringing higher exemptions for entry-level apartments and townhouses.',
    publishedAt: new Date(Date.now() - 10 * 3600 * 1000).toISOString(),
    section: {
      name: 'Politics',
      slug: 'politics',
    },
    image: {
      url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
      source: 'Unsplash',
    },
    imageAlt: 'Modern city apartment buildings in Brisbane',
    imageCredit: {
      name: 'Scott Webb',
      link: 'https://unsplash.com',
    },
    bodyText: [
      'State treasurers have jointly announced calibrated adjustments to first home buyer assistance schemes, directly targeting housing affordability challenges for younger Australians.',
      'In NSW, the transfer duty exemption threshold has expanded to accommodate rising medium-density dwelling values in Western Sydney and the Illawarra corridor.',
      'Similar legislation introduced in Queensland seeks to bolster off-the-plan acquisitions, exempting eligible buyers from stamp duty on properties up to $700,000.',
      'Industry bodies have welcomed the amendments, asserting that targeted stamp duty relief remains the most immediate mechanism to bridge the deposit gap.',
    ],
  },
  {
    id: 'demo-4',
    headline: 'Kitchen Renovations: 5 Material Trends Dominating Australian Homes',
    slug: 'kitchen-renovations-top-material-trends',
    summary:
      'From zero-silica mineral surfaces to warm Australian hardwood joinery, homeowners are prioritizing tactile finishes and enduring low-maintenance craftsmanship.',
    publishedAt: new Date(Date.now() - 16 * 3600 * 1000).toISOString(),
    section: {
      name: 'Renovation',
      slug: 'renovation',
    },
    image: {
      url: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1200&q=80',
      source: 'Unsplash',
    },
    imageAlt: 'Modern minimalist kitchen with timber cabinets and stone island',
    imageCredit: {
      name: 'R ARCHITECTURE',
      link: 'https://unsplash.com',
    },
    bodyText: [
      'Following national safety regulations banning traditional engineered stone, the kitchen design sector has experienced a creative renaissance centered on natural limestone, porcelain slabs, and silica-free recycled composites.',
      'Melbourne interior designer Liam Cooper notes a strong pivot away from stark, sterile all-white kitchens towards layered earthy palettes featuring Tasmanian Oak, fluted joinery, and patinated brass tapware.',
      'Concealed butler pantries and induction cooktops integrated flush with benchtops are also among the most requested features in 2026 home renovations.',
    ],
  },
  {
    id: 'demo-5',
    headline: 'Zoning Reforms: How Medium Density Rules Are Changing Brisbane Suburbs',
    slug: 'zoning-reforms-medium-density-brisbane',
    summary:
      'Planning updates allow dual-occupancies and micro-developments in established inner-ring precincts, opening new pathways for suburban infill.',
    publishedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    section: {
      name: 'Politics',
      slug: 'politics',
    },
    image: {
      url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
      source: 'Unsplash',
    },
    imageAlt: 'Modern duplex housing in sunny Queensland',
    imageCredit: {
      name: 'Todd Kent',
      link: 'https://unsplash.com',
    },
    bodyText: [
      'Urban planning overhauls are reshaping residential density across Queensland’s capital. The revised code encourages gentle density, enabling homeowners on blocks greater than 600 square meters to subdivide or construct dual-occupancy duplexes.',
      'Council representatives state that the objective is to increase housing supply near active transport corridors without compromising traditional Queenslander character protections.',
    ],
  },
  {
    id: 'demo-6',
    headline: 'Passive House Retrofits: Cutting Energy Bills in Melbourne Winters',
    slug: 'passive-house-retrofits-melbourne-winters',
    summary:
      'Thermal bridging elimination, airtight membranes, and heat-recovery ventilation systems prove effective in older weatherboard cottages.',
    publishedAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
    section: {
      name: 'Renovation',
      slug: 'renovation',
    },
    image: {
      url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
      source: 'Unsplash',
    },
    imageAlt: 'High-performance timber clad Australian family home',
    imageCredit: {
      name: 'Avi Waxman',
      link: 'https://unsplash.com',
    },
    bodyText: [
      'Retrofitting existing Australian housing stock to certified Passive House standards was once considered prohibitively expensive. However, localized supply chains for triple glazing and airtight wraps have made retrofits increasingly viable.',
      'A recent pilot project in Northcote demonstrated a 75% reduction in annual heating demand through comprehensive wall insulation, air sealing, and an HRV installation.',
    ],
  },
]
