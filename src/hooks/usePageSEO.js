import { useEffect } from "react";

const DEFAULT_TITLE = "Les Kick't | Seattle Community Soccer Tournaments";
const DEFAULT_DESC =
  "Les Kick't brings competitive street soccer tournaments, youth development, and community impact events to Greater Seattle.";

export const usePageSEO = (title, description) => {
  useEffect(() => {
    document.title = title ? `${title} | Les Kick't` : DEFAULT_TITLE;

    const metaDescription = document.querySelector("meta[name='description']");
    if (metaDescription) {
      metaDescription.setAttribute("content", description || DEFAULT_DESC);
    }
  }, [title, description]);
};

export default usePageSEO;
