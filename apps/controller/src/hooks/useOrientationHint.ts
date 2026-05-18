import { useEffect, useState } from "react";

type OrientationHint = "portrait" | "landscape";

function readOrientation(): OrientationHint {
  if (typeof window === "undefined") {
    return "portrait";
  }

  return window.innerWidth > window.innerHeight ? "landscape" : "portrait";
}

export function useOrientationHint(): OrientationHint {
  const [orientation, setOrientation] = useState<OrientationHint>(readOrientation());

  useEffect(() => {
    const handleResize = () => setOrientation(readOrientation());
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return orientation;
}
