import { useRouter } from "next/router";

import { AppLayout } from "@/components/layout/AppLayout";
import { trpcClient } from "@/modules/trpc/trpc-client";

export default function HomePage() {
  const router = useRouter();

  const { data: health } = trpcClient.ai.checkHealth.useQuery(undefined, {
    refetchInterval: 30000, // refresh every 30s
    retry: false,
  });

  return (
    <AppLayout activePage="home" title="Image Studio" description="AI-powered product image editor">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <QuickActionCard
          title="New Canvas"
          description="Start with a blank canvas or upload an image"
          icon={<PlusIcon />}
          onClick={() => router.push("/editor")}
        />
        <QuickActionCard
          title="Edit Product Image"
          description="Browse your catalog and edit product photos"
          icon={<ImageIcon />}
          onClick={() => router.push("/products")}
        />
        <QuickActionCard
          title="Use Template"
          description="Start from a pre-built e-commerce template"
          icon={<TemplateIcon />}
          onClick={() => router.push("/templates")}
        />
        <QuickActionCard
          title="My Projects"
          description="Open or continue a saved canvas project"
          icon={<FolderIcon />}
          onClick={() => router.push("/projects")}
        />
        <QuickActionCard
          title="My Library"
          description="Browse your saved design components"
          icon={<LibraryIcon />}
          onClick={() => router.push("/library")}
        />
        <QuickActionCard
          title="Social Post"
          description="Create social media posts with brand kit"
          icon={<ShareIcon />}
          onClick={() => router.push("/editor")}
        />
      </div>

      <div className="mt-8">
        <h2 className="text-base font-semibold mb-4">AI Services Status</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <ServiceStatusCard
            name="Background Removal"
            description="rembg (self-hosted)"
            status={health ? (health.rembg ? "online" : "offline") : "pending"}
          />
          <ServiceStatusCard
            name="Image Upscaling"
            description="Real-ESRGAN (self-hosted)"
            status={health ? (health.esrgan ? "online" : "offline") : "pending"}
          />
          <ServiceStatusCard
            name="AI Generation"
            description="Nano Banana (Gemini)"
            status={health ? (health.gemini ? "online" : "offline") : "pending"}
          />
        </div>
      </div>
    </AppLayout>
  );
}

function QuickActionCard({
  title,
  description,
  icon,
  onClick,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-start gap-3 rounded-lg border p-6 text-left transition-colors hover:bg-accent/50"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <div>
        <h3 className="font-medium">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </button>
  );
}

function ServiceStatusCard({
  name,
  description,
  status,
}: {
  name: string;
  description: string;
  status: "online" | "offline" | "pending";
}) {
  const colors = {
    online: "bg-green-500",
    offline: "bg-red-500",
    pending: "bg-yellow-500",
  };

  return (
    <div className="flex items-center gap-3 rounded-lg border p-4">
      <div className={`h-2.5 w-2.5 rounded-full ${colors[status]}`} />
      <div>
        <p className="text-sm font-medium">{name}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function PlusIcon() {
  return (
    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
  );
}

function TemplateIcon() {
  return (
    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="7" x="3" y="3" rx="1" />
      <rect width="9" height="7" x="3" y="14" rx="1" />
      <rect width="5" height="7" x="16" y="14" rx="1" />
    </svg>
  );
}

function FolderIcon() {
  return (
    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
    </svg>
  );
}

function LibraryIcon() {
  return (
    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m16 6 4 14" />
      <path d="M12 6v14" />
      <path d="M8 8v12" />
      <path d="M4 4v16" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" x2="15.42" y1="13.51" y2="17.49" />
      <line x1="15.41" x2="8.59" y1="6.51" y2="10.49" />
    </svg>
  );
}
