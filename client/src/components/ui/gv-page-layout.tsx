import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface GVPageLayoutProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function GVPageLayout({
  title,
  subtitle,
  actions,
  children,
  className,
}: GVPageLayoutProps) {
  return (
    <div className={cn("flex flex-col h-full", className)}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-page-title">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1" data-testid="text-page-subtitle">
              {subtitle}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 flex-wrap" data-testid="container-page-actions">
            {actions}
          </div>
        )}
      </div>
      <div className="flex-1 pt-6 overflow-auto">
        {children}
      </div>
    </div>
  );
}

interface GVFilterSectionProps {
  children: ReactNode;
  className?: string;
}

export function GVFilterSection({ children, className }: GVFilterSectionProps) {
  return (
    <div className={cn("bg-muted/30 rounded-lg p-4 mb-6", className)} data-testid="container-filters">
      <div className="flex flex-wrap items-end gap-4">
        {children}
      </div>
    </div>
  );
}

interface GVFilterFieldProps {
  label: string;
  children: ReactNode;
  className?: string;
}

export function GVFilterField({ label, children, className }: GVFilterFieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </label>
      {children}
    </div>
  );
}

interface GVContentSectionProps {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function GVContentSection({ 
  title, 
  description, 
  actions, 
  children, 
  className 
}: GVContentSectionProps) {
  return (
    <div className={cn("", className)}>
      {(title || actions) && (
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            {title && <h2 className="text-lg font-medium">{title}</h2>}
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
