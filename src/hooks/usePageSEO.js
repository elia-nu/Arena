import { useEffect } from "react";

const DEFAULT_TITLE = "The Arena | Seattle Community Soccer Tournaments";
const DEFAULT_DESC =
  "The Arena brings competitive street soccer tournaments, youth development, and community impact events to Greater Seattle.";

export const usePageSEO = (title, description) => {
  useEffect(() => {
    document.title = title ? `${title} | The Arena` : DEFAULT_TITLE;

    const metaDescription = document.querySelector("meta[name='description']");
    if (metaDescription) {
      metaDescription.setAttribute("content", description || DEFAULT_DESC);
    }
  }, [title, description]);
};

export default usePageSEO;
