/// <reference types="vite/client" />

declare global {
  const __APP_VERSION__: string;

  namespace JSX {
    interface Element extends React.ReactElement<any, any> { }
    interface ElementClass extends React.Component<any> {
      render(): React.ReactNode;
    }
    interface ElementAttributesProperty { props: {}; }
    interface ElementChildrenAttribute { children: {}; }
    interface IntrinsicElements extends React.JSX.IntrinsicElements { }
  }
}

export {};
