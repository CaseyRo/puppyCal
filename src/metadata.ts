import type { PlannerTab } from './config';

interface MetadataInput {
  activeTab: PlannerTab;
  canonicalUrl: string;
}

interface PlannerMetadata {
  title: string;
  description: string;
  canonical: string;
  ogTitle: string;
  ogDescription: string;
  jsonLd: Record<string, unknown>;
}

function ensureMeta(name: string, content: string, useProperty = false): void {
  const selector = useProperty ? `meta[property="${name}"]` : `meta[name="${name}"]`;
  let tag = document.head.querySelector(selector) as HTMLMetaElement | null;
  if (!tag) {
    tag = document.createElement('meta');
    if (useProperty) {
      tag.setAttribute('property', name);
    } else {
      tag.setAttribute('name', name);
    }
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

function ensureCanonical(canonical: string): void {
  let link = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.href = canonical;
}

export function composePlannerMetadata(input: MetadataInput): PlannerMetadata {
  const tabLabel =
    input.activeTab === 'walkies' ? 'walkies' : input.activeTab === 'dog' ? 'my dog' : 'food';
  const description = 'PuppyCal — daily food calculator and walk planner for your puppy.';

  return {
    title: `PuppyCal - ${tabLabel}`,
    description,
    canonical: input.canonicalUrl,
    ogTitle: `PuppyCal (${tabLabel})`,
    ogDescription: description,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'PuppyCal',
      description,
      applicationCategory: 'LifestyleApplication',
      operatingSystem: 'Web',
      url: input.canonicalUrl,
      potentialAction: {
        '@type': 'UseAction',
        name:
          input.activeTab === 'walkies'
            ? 'Generate walk schedule'
            : input.activeTab === 'dog'
              ? 'Manage dog profile'
              : 'Calculate daily food portion',
      },
    },
  };
}

export function applyPlannerMetadata(input: MetadataInput): void {
  const metadata = composePlannerMetadata(input);
  document.title = metadata.title;
  ensureCanonical(metadata.canonical);
  ensureMeta('description', metadata.description);
  ensureMeta('robots', 'index,follow');
  ensureMeta('og:title', metadata.ogTitle, true);
  ensureMeta('og:description', metadata.ogDescription, true);
  ensureMeta('og:type', 'website', true);
  ensureMeta('og:url', metadata.canonical, true);
  ensureMeta('twitter:card', 'summary', false);

  const scriptId = 'planner-jsonld';
  let script = document.getElementById(scriptId) as HTMLScriptElement | null;
  if (!script) {
    script = document.createElement('script');
    script.id = scriptId;
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(metadata.jsonLd);
}
