export const queryKeys = {
  me: () => ['me'] as const,
  documents: {
    all: () => ['documents'] as const,
    list: () => [...queryKeys.documents.all(), 'list'] as const,
  },
  conversations: {
    all: () => ['conversations'] as const,
    list: () => [...queryKeys.conversations.all(), 'list'] as const,
    detail: (id: string) => [...queryKeys.conversations.all(), id] as const,
  },
  settings: {
    widgetKeys: () => ['settings', 'widget-keys'] as const,
    origins: () => ['settings', 'origins'] as const,
    team: () => ['settings', 'team'] as const,
  },
}
