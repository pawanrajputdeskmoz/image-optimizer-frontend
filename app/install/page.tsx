"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Loading from "../_components/loading";

import { InstallApi } from "@/app/_api/apiCall";
import type { InstallResponse } from "./types";

function InstallContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const context = searchParams.get("context");
  const scope = searchParams.get("scope");
  const singed_payload = searchParams.get("signed_payload_jwt");

  const [loading, setLoading] = useState(true);
  const [validUser, setValidUser] = useState(false);

  useEffect(() => {
    let isMounted = true;

    InstallApi("store/load-application", { code, context, scope, signed_payload_jwt: singed_payload })
      .then((data: InstallResponse) => {
        if (!isMounted) return;

        if (data?.success == false) {
          console.log("Install failed:", data.error);
          setValidUser(false);
          return;
        }

        const isValid = data?.success == true;
        setValidUser(isValid);

        if (isValid) {
          const result = data?.data;
          localStorage.setItem("api-token", result?.api_token ?? "");
          localStorage.setItem("shop", result?.storeHash ?? "");
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
  }, [code, context, router, scope, singed_payload]);

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
