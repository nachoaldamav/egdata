export function ClientOnly({ children }: { children: React.ReactNode }) {
  return typeof window === 'undefined' ? null : children;
}
