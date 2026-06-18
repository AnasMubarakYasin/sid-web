"use client";

import ReactPlayer from "react-player";
import {
  MediaController,
  MediaControlBar,
  MediaTimeRange,
  MediaTimeDisplay,
  MediaVolumeRange,
  MediaPlaybackRateButton,
  MediaPlayButton,
  MediaSeekBackwardButton,
  MediaSeekForwardButton,
  MediaMuteButton,
  MediaFullscreenButton,
} from "media-chrome/react";

export default function Player(props: { src: string; className: string }) {
  return (
    <MediaController className={props.className ?? "w-stretch aspect-video"}>
      <ReactPlayer
        slot="media"
        src={props.src}
        controls={false}
        style={{
          width: "100%",
          height: "100%",
          "--controls": "none",
        }}
      ></ReactPlayer>
      <MediaControlBar>
        <MediaPlayButton className="px-2" />
        <MediaSeekBackwardButton className="px-2" seekOffset={10} />
        <MediaSeekForwardButton className="px-2" seekOffset={10} />
        <MediaTimeRange className="px-2" />
        <MediaTimeDisplay className="px-2" showDuration />
        <MediaMuteButton className="px-2" />
        <MediaVolumeRange className="px-2" />
        <MediaPlaybackRateButton className="px-2" />
        <MediaFullscreenButton className="px-2" />
      </MediaControlBar>
    </MediaController>
  );
}
