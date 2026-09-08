"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import Loading from "../_components/loading";

import { InstallApi } from "@/app/_api/apiCall";
import type { InstallResponse } from "./types";

function InstallContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const context = searchParams.get("context");
  const scope = searchParams.get("scope");
  const signedPayload = searchParams.get("signed_payload_jwt");

  const [loading, setLoading] = useState(true);
  const [validUser, setValidUser] = useState(false);

  useEffect(() => {
    let isMounted = true;

    InstallApi("store/load-application", {
      code,
      context,
      scope,
      signed_payload_jwt: signedPayload,
    })
      .then((data: InstallResponse) => {
        if (!isMounted) return;

        if (data?.success !== true) {
          toast.error(
            data?.message ||
              "We could not finish setup. Please try installing again."
          );
          setValidUser(false);
          return;
        }

        const result = data.data;
        const userId = result?.user_id?.trim() || "";
        const userHash = result?.user_hash?.trim() || "";

        if (!userId) {
          toast.error(
            "Something went wrong during setup. Please try installing again."
          );
          setValidUser(false);
          return;
        }

        if (!userHash) {
          toast.error(
            "Chat support is temporarily unavailable. You can continue using the app."
          );
        }

        localStorage.setItem("api-token", result?.api_token ?? "");
        localStorage.setItem("shop", result?.storeHash ?? "");
        localStorage.setItem("manage_service", result?.manage_services ?? "");
        localStorage.setItem("user_id", userId);

        if (userHash) {
          localStorage.setItem("user_hash", userHash);
        } else {
          localStorage.removeItem("user_hash");
        }

        localStorage.removeItem("intercom_user_id");
        localStorage.removeItem("intercom_email");
        localStorage.removeItem("intercom_name");

        localStorage.setItem(
          "channel",
          JSON.stringify(result?.channel_list?.[0] ?? {})
        );

        setValidUser(true);
        router.replace("/dashboard");
      })
      .catch(() => {
        if (!isMounted) return;
        toast.error(
          "We could not reach the server. Please check your connection and try again."
        );
        setValidUser(false);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [code, context, router, scope, signedPayload]);

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
