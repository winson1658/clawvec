export function getOrCreateVisitorToken(): string {
  if (typeof window === 'undefined') return 'ssr';
  let token = localStorage.getItem('visitor_token');
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem('visitor_token', token);
  }
  return token;
}

export function recordVisitorAction(actionType: string, payload: Record<string, unknown> = {}) {
  if (typeof window === 'undefined') return;
  const visitorToken = getOrCreateVisitorToken();
  const raw = localStorage.getItem('visitor_actions');
  const actions = raw ? JSON.parse(raw) : [];
  actions.push({
    action_type: actionType,
    payload,
    created_at: new Date().toISOString(),
  });
  localStorage.setItem('visitor_token', visitorToken);
  localStorage.setItem('visitor_actions', JSON.stringify(actions.slice(-50)));
}
