declare module "*.mdx" {
  import * as React from "react";

  // Add whatever named exports you actually use:
  export const glossary: Record<string, string>;

  // Default export remains the MDX component
  const MDXComponent: (props: any) => React.ReactElement;
  export default MDXComponent;
}
