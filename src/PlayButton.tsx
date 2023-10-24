import React from "react";

export function PlayButton({ onClick }: { onClick: () => void }) {
  return <button onClick={onClick}>⏯️</button>;
}
