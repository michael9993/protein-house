import { type ReactNode } from "react";
import { Controller, type Control } from "react-hook-form";

import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  name: string;
  control: Control<any>;
  comingSoon?: boolean;
}

export function FeatureCard({ icon, title, description, name, control, comingSoon }: FeatureCardProps) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <div
          className={cn(
            "relative rounded-lg border p-4 transition-all",
            field.value ? "border-l-4 border-l-primary" : "opacity-75",
            comingSoon && "opacity-60"
          )}
        >
          {comingSoon && (
            <Badge variant="warning" className="absolute top-2 end-2 text-[10px] px-1.5 py-0">
              Coming Soon
            </Badge>
          )}
          <div className="mb-3 h-6 w-6">{icon}</div>
          <h3 className="font-medium">{title}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          <div className="mt-3">
            <Switch
              checked={field.value ?? false}
              onCheckedChange={field.onChange}
            />
          </div>
        </div>
      )}
    />
  );
}
