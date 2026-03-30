"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Loading from "../_components/loading";

import { InstallApi } from "@/app/_api/apiCall";

interface InstallResponse {
  status_code?: number;
  data?: {
    api_token?: string;
    shop?: string;
    manage_services?: string;
    user_id?: string;
    channel_list?: Array<{ channel_id?: number }>;
  };
}

function InstallContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const context = searchParams.get("context");
  const scope = searchParams.get("scope");

  const [loading, setLoading] = useState(true);
  const [validUser, setValidUser] = useState(false);

  useEffect(() => {
    let isMounted = true;

    InstallApi("appInstall", { code, context, scope })
      .then((data: InstallResponse) => {
        if (!isMounted) return;

        const isValid = data?.status_code === 200;
        setValidUser(isValid);

        if (isValid) {
          const result = data?.data;
          localStorage.setItem("api-token", result?.api_token ?? "");
          localStorage.setItem("shop", result?.shop ?? "");
          localStorage.setItem("manage_service", result?.manage_services ?? "");
          localStorage.setItem("user_id", result?.user_id ?? "");
          localStorage.setItem(
            "channel",
            JSON.stringify(result?.channel_list?.[0] ?? {})
          );
          router.replace("/dashboard");
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [code, context, router, scope]);

  if (loading || validUser) return <Loading />;

  return (
    <div className="mx-auto w-full max-w-2xl p-8">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
        Installation failed
      </h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        We could not validate your install request. Please try installing again.
      </p>
    </div>
  );
}

export default function InstallPage() {
  return (
    <Suspense fallback={<Loading />}>
      <InstallContent />
    </Suspense>
  );
}
