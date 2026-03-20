import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/router";
import { z } from "zod";

import { trpcClient } from "@/modules/trpc/trpc-client";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  clientId: z.string().min(1, "Client ID is required"),
  clientSecret: z.string().min(1, "Client Secret is required"),
});

type FormValues = z.infer<typeof formSchema>;

export function NewPayPalConfigForm() {
  const router = useRouter();
  const utils = trpcClient.useUtils();
  const { mutate, isLoading, error } = trpcClient.appConfig.saveNewPayPalConfig.useMutation({
    onSuccess: () => {
      void utils.appConfig.getPayPalConfigsList.invalidate();
      router.push("/config");
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors: formErrors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = (data: FormValues) => {
    mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {error && (
        <div style={{ padding: "12px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "6px", color: "#dc2626", fontSize: "14px" }}>
          {error.message}
        </div>
      )}

      <div>
        <label htmlFor="name" style={{ display: "block", marginBottom: "4px", fontWeight: 500, fontSize: "14px" }}>
          Configuration Name
        </label>
        <input
          id="name"
          {...register("name")}
          placeholder="e.g., PayPal Sandbox, PayPal Live"
          style={{ width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px" }}
        />
        {formErrors.name && (
          <p style={{ marginTop: "4px", color: "#dc2626", fontSize: "12px" }}>{formErrors.name.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="clientId" style={{ display: "block", marginBottom: "4px", fontWeight: 500, fontSize: "14px" }}>
          Client ID
        </label>
        <input
          id="clientId"
          {...register("clientId")}
          placeholder="PayPal Client ID from developer.paypal.com"
          style={{ width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px", fontFamily: "monospace" }}
        />
        {formErrors.clientId && (
          <p style={{ marginTop: "4px", color: "#dc2626", fontSize: "12px" }}>{formErrors.clientId.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="clientSecret" style={{ display: "block", marginBottom: "4px", fontWeight: 500, fontSize: "14px" }}>
          Client Secret
        </label>
        <input
          id="clientSecret"
          type="password"
          {...register("clientSecret")}
          placeholder="PayPal Client Secret"
          style={{ width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px", fontFamily: "monospace" }}
        />
        {formErrors.clientSecret && (
          <p style={{ marginTop: "4px", color: "#dc2626", fontSize: "12px" }}>{formErrors.clientSecret.message}</p>
        )}
      </div>

      <div style={{ paddingTop: "8px" }}>
        <button
          type="submit"
          disabled={isLoading}
          style={{
            padding: "10px 24px",
            background: isLoading ? "#9ca3af" : "#0070ba",
            color: "white",
            border: "none",
            borderRadius: "6px",
            fontSize: "14px",
            fontWeight: 600,
            cursor: isLoading ? "not-allowed" : "pointer",
          }}
        >
          {isLoading ? "Validating credentials..." : "Add PayPal Configuration"}
        </button>
      </div>

      <p style={{ fontSize: "12px", color: "#6b7280" }}>
        The app will validate your credentials by connecting to PayPal before saving.
      </p>
    </form>
  );
}
