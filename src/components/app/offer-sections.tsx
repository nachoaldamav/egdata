import { Link } from '@remix-run/react';
import { cn } from '~/lib/utils';

type LinkItem = {
  id: string;
  label: string;
  href: string;
};

type SectionSelectorProps = {
  links: LinkItem[];
  activeSection: string;
  onSectionChange: (id: string) => void;
};

export function SectionsNav({ links, activeSection, onSectionChange }: SectionSelectorProps) {
  return (
    <nav className="w-full max-w-3xl">
      <ul className="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground">
        {links.map((link) => (
          <li
            key={link.id}
            className="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground"
          >
            <Link
              to={link.href}
              className={cn(
                activeSection === link.id
                  ? 'bg-background text-white shadow'
                  : 'hover:bg-primary/10 text-gray-200',
                'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
              )}
              onClick={(e) => {
                e.preventDefault();
                onSectionChange(link.id);
              }}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
