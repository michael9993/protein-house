import { type ReactNode, useState } from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface FormSectionProps {
  id?: string;
  title: string;
  description?: string;
  icon?: ReactNode;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  comingSoon?: boolean;
  children: ReactNode;
  className?: string;
}

function FormSectionHeader({
  icon,
  title,
  description,
  collapsible,
  comingSoon,
  isOpen,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  collapsible?: boolean;
  comingSoon?: boolean;
  isOpen?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      {icon && (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
          {icon}
        </div>
      )}
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold leading-none tracking-tight">
            {title}
          </h3>
          {comingSoon && (
            <Badge variant="warning" className="text-[10px] px-1.5 py-0">
              Coming Soon
            </Badge>
          )}
        </div>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {collapsible && (
        <ChevronDown
          className={cn(
            "h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-180",
          )}
        />
      )}
    </div>
  );
}

export function FormSection({
  id,
  title,
  description,
  icon,
  collapsible = false,
  defaultExpanded = true,
  comingSoon,
  children,
  className,
}: FormSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultExpanded);

  if (collapsible) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <Card id={id} className={cn("overflow-hidden", comingSoon && "opacity-60", className)}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer select-none hover:bg-muted/50">
              <FormSectionHeader
                icon={icon}
                title={title}
                description={description}
                collapsible
                comingSoon={comingSoon}
                isOpen={isOpen}
              />
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">{children}</CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    );
  }

  return (
    <Card id={id} className={cn(comingSoon && "opacity-60", className)}>
      <CardHeader>
        <FormSectionHeader
          icon={icon}
          title={title}
          description={description}
          comingSoon={comingSoon}
        />
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}
