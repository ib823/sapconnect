type EventName =
  | 'page_view'
  | 'cta_click'
  | 'roi_calculate'
  | 'capability_view'
  | 'doc_view'
  | 'github_click'
  | 'contact_submit'
  | 'nav_click'
  | 'scroll_depth';

interface AnalyticsProvider {
  track(event: EventName, properties?: Record<string, unknown>): void;
  page(path: string): void;
}

const noopProvider: AnalyticsProvider = {
  track: () => {},
  page: () => {},
};

let provider: AnalyticsProvider = noopProvider;

export function setAnalyticsProvider(p: AnalyticsProvider) {
  provider = p;
}

export function track(event: EventName, properties?: Record<string, unknown>) {
  provider.track(event, properties);
}

export function page(path: string) {
  provider.page(path);
}
