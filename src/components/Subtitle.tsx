import { AbsoluteFill } from "remotion";

export const Subtitle: React.FC<{ text: string }> = ({ text }) => {
  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        alignItems: "center",
        paddingBottom: 300,
      }}
    >
      <div
        style={{
          width: "80%",
          color: "white",
          fontSize: 80,
          fontWeight: "bold",
          textAlign: "center",
          lineHeight: 1.4,
          whiteSpace: "pre-line",
          textShadow: "0px 0px 20px rgba(0,0,0,0.8)",
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};
