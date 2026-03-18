// Fix: augment csstype to accept newer CSS values from dependencies (type-only)
// This file broadens `Properties` for the local `client` package and also
// augments a nested copy used by some dependencies (e.g. react-hot-toast).
import 'csstype';

declare module 'csstype' {
  // Broaden CSS properties to be permissive across differing csstype versions
  // This is a type-only compatibility shim to avoid cross-package union mismatches
  interface Properties<TLength = string | 0> {
    [key: string]: any;
  }
}

// Augment nested csstype that may be shipped inside some dependencies
// (covers cases like react-hot-toast/node_modules/csstype)
declare module 'react-hot-toast/node_modules/csstype' {
  interface Properties<TLength = string | 0> {
    [key: string]: any;
  }
}
