import { createContext } from 'react';

export const PageCtx = createContext({
  navbarHeight: 100,
  footerHeight: 50,
  bodyHeight: 400,
  navbarLeft: 10,
  disableScroll: false,
});
