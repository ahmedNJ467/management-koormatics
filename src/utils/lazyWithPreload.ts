import React from "react";

export type PreloadableComponent<T = any> = React.LazyExoticComponent<
  React.ComponentType<T>
> & {
  preload: () => Promise<{ default: React.ComponentType<T> }>;
};

export function lazyWithPreload<T = any>(
  factory: () => Promise<{ default: React.ComponentType<T> }>
): PreloadableComponent<T> {
  const Component = React.lazy(factory) as PreloadableComponent<T>;
  Component.preload = factory;
  return Component;
}
