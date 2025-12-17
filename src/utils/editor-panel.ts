import { useEffect, useState } from "react";

export function getQueryParam(name: string) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}


export function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(
    () => window.innerWidth >= 1024
  );

  useEffect(() => {
    const onResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return isDesktop;
}
