import { cn } from '../../lib/cn';

export interface FooterProps {
  version?: string;
  className?: string;
}

export function Footer({ version, className }: FooterProps) {
  return (
    <footer
      className={cn(
        'flex h-10 items-center justify-between border-t px-4 text-xs text-muted-foreground',
        className,
      )}
    >
      <span>© {new Date().getFullYear()} GORAZUS</span>
      {version && <span>v{version}</span>}
    </footer>
  );
}
