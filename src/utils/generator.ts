import shortId from "shortid";

shortId.seed(1831);

export const generateId = () => {
  return shortId.generate() as string;
};
