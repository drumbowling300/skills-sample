import React from "react";

export type VideoItem = {
  src: string;
  duration: number;
};

export type MainProps = {
  manifest: VideoItem[];
};

const Main: React.FC<MainProps> = ({ manifest }) => {
  return (
    <div style={{ width: "100%", height: "100%", backgroundColor: "#000" }}>
      {manifest.map((video, index) => (
        <div key={index} style={{ marginBottom: 10, color: "#fff" }}>
          <p>Video {index + 1}</p>
          <p>Src: {video.src}</p>
          <p>Duration: {video.duration} frames</p>
        </div>
      ))}
    </div>
  );
};

export default Main;