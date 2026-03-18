// Augment React's CSSProperties to be permissive to avoid cross-package csstype
// incompatibilities when multiple versions of `csstype` are present.
import 'react';

declare module 'react' {
  interface CSSProperties {
    [key: string]: any;
  }
}
