export const encode = (str: string) => {
  return btoa(unescape(encodeURIComponent(str)));
};

export const decode = (str: string) => {
  return decodeURIComponent(escape(atob(str)));
};
