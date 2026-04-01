import { Api } from "@/app/_api/apiCall";
import { useEffect, useState } from "react";
import Image from "next/image";
import { basePath } from "@/next.config";
import { memo } from "react";

function Home() {
  const [list, setList] = useState<any>([
    { domain: "Loading...", channel_id: "1" },
  ]);
  const [channelId, setChannelId] = useState<any>(1);

  const getChannelList = () => {
    Api("getChannelList", { store_id: localStorage?.getItem("user_id") }).then(
      ({ data }: any) => {
        setList(data);
        if (!localStorage?.getItem("channel")) {
          localStorage.setItem("channel", JSON.stringify(data[0]));
        }
      },
    );
  };

  const handleChangeChannel = (event: any) => {
    setChannelId(event.target.value);
    localStorage.setItem(
      "channel",
      JSON.stringify(
        list.find((item: any) => item.channel_id == event.target.value),
      ),
    );
    const currentURL = window.location.href;
    if (currentURL.indexOf("/install") > 0 || currentURL.indexOf("/load") > 0) {
      window.location.replace(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard`);
    } else {
      window.location.reload();
    }
  };

  useEffect(() => {
    setChannelId(
      (localStorage?.getItem("channel") &&
        JSON.parse(localStorage?.getItem("channel") ?? "").channel_id) ||
        1,
    );
    getChannelList();
  }, []);
  const selectedChannel = list.find(
    (item: any) => item.channel_id == channelId,
  );
  const displayText = selectedChannel?.domain?.replace("https://", "") || "";

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .custom-dropi .form-select {
          text-overflow: ellipsis !important;
          overflow: hidden !important;
          white-space: nowrap !important;
          max-width: 100% !important;
        }
      `,
        }}
      />
      <div className="custom-dropi link-iconDropi flex-1 lg:flex-none  lg:w-[240px]">
        <span className="dropiLabel">
          Channel
          <a href={selectedChannel?.domain} target="_blank">
            <Image
              src={`${basePath}/images/link-icon.svg`}
              alt=""
              width={20}
              height={20}
            />
          </a>
        </span>
        <div
          style={{
            position: "relative",
            width: "100%",
            overflow: "hidden",
          }}
        >
          <select
            className="form-select"
            aria-label="Default select example"
            onChange={handleChangeChannel}
            value={channelId}
            style={{
              width: "100%",
              textOverflow: "ellipsis",
              overflow: "hidden",
              whiteSpace: "nowrap",
              paddingRight: "30px",
            }}
            title={displayText}
          >
            {list.map((item: any, key: any) => (
              <option key={key} value={item.channel_id}>
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
