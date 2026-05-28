import { ApiCall } from "@/app/_api/apiCall";
import { memo, useCallback, useEffect, useState, type ChangeEvent } from "react";
import Image from "next/image";
import { basePath } from "@/app/lib/basePath";

type ChannelItem = {
  domain: string;
  channel_id: string | number;
};

type ChannelListResponse = { data?: ChannelItem[] };

function readStoredChannelId(): string | number {
  if (typeof window === "undefined") return 1;
  try {
    const raw = localStorage.getItem("channel");
    if (!raw) return 1;
    return (JSON.parse(raw) as ChannelItem).channel_id ?? 1;
  } catch {
    return 1;
  }
}

function Home() {
  const [list, setList] = useState<ChannelItem[]>([
    { domain: "Loading...", channel_id: "1" },
  ]);
  const [channelId, setChannelId] = useState<string | number>(readStoredChannelId);

  const getChannelList = useCallback(() => {
    void ApiCall("getChannelList", { store_id: localStorage?.getItem("user_id") }).then(
      (raw) => {
        const response = raw as ChannelListResponse;
        const data = response.data ?? [];
        setList(data);
        if (!localStorage?.getItem("channel") && data[0]) {
          localStorage.setItem("channel", JSON.stringify(data[0]));
        }
      },
    );
  }, []);

  const handleChangeChannel = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    setChannelId(value);
    localStorage.setItem(
      "channel",
      JSON.stringify(list.find((item) => String(item.channel_id) === value)),
    );
    const currentURL = window.location.href;
    if (currentURL.includes("/install") || currentURL.includes("/load")) {
      window.location.replace(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard`);
    } else {
      window.location.reload();
    }
  };

  useEffect(() => {
    getChannelList();
  }, [getChannelList]);

  const selectedChannel = list.find(
    (item) => String(item.channel_id) === String(channelId),
  );
  const displayText = selectedChannel?.domain?.replace("https://", "") || "";

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `.custom-dropi .form-select{text-overflow:ellipsis!important;overflow:hidden!important;white-space:nowrap!important;max-width:100%!important}`,
        }}
      />
      <div className="custom-dropi link-iconDropi flex-1 lg:flex-none lg:w-[240px]">
        <span className="dropiLabel">
          Channel
          <a href={selectedChannel?.domain} target="_blank">
            <Image src={`${basePath}/images/link-icon.svg`} alt="" width={20} height={20} />
          </a>
        </span>
        <div style={{ position: "relative", width: "100%", overflow: "hidden" }}>
          <select
            className="form-select"
            aria-label="Select channel"
            onChange={handleChangeChannel}
            value={String(channelId)}
            style={{
              width: "100%",
              textOverflow: "ellipsis",
              overflow: "hidden",
              whiteSpace: "nowrap",
              paddingRight: "30px",
            }}
            title={displayText}
          >
            {list.map((item) => (
              <option key={String(item.channel_id)} value={String(item.channel_id)}>
                {item.domain.replace("https://", "")}
              </option>
            ))}
          </select>
        </div>
      </div>
    </>
  );
}

export default memo(Home);
