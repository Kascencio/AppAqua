/**
 * Type declarations for react-window
 * @see https://react-window.now.sh/
 */
declare module 'react-window' {
  import * as React from 'react';

  export interface ListChildComponentProps<T = unknown> {
    index: number;
    style: React.CSSProperties;
    data: T;
    isScrolling?: boolean;
  }

  export interface ListOnScrollProps {
    scrollDirection: 'forward' | 'backward';
    scrollOffset: number;
    scrollUpdateWasRequested: boolean;
  }

  export interface ListOnItemsRenderedProps {
    overscanStartIndex: number;
    overscanStopIndex: number;
    visibleStartIndex: number;
    visibleStopIndex: number;
  }

  export interface CommonProps<T = unknown> {
    children: React.ComponentType<ListChildComponentProps<T>>;
    className?: string;
    direction?: 'ltr' | 'rtl';
    height: number | string;
    initialScrollOffset?: number;
    innerRef?: React.Ref<HTMLDivElement>;
    innerElementType?: React.ElementType;
    itemCount: number;
    itemData?: T;
    onItemsRendered?: (props: ListOnItemsRenderedProps) => void;
    onScroll?: (props: ListOnScrollProps) => void;
    outerRef?: React.Ref<HTMLDivElement>;
    outerElementType?: React.ElementType;
    overscanCount?: number;
    style?: React.CSSProperties;
    useIsScrolling?: boolean;
    width: number | string;
    layout?: 'horizontal' | 'vertical';
  }

  export interface FixedSizeListProps<T = unknown> extends CommonProps<T> {
    itemSize: number;
  }

  export interface VariableSizeListProps<T = unknown> extends CommonProps<T> {
    estimatedItemSize?: number;
    itemSize: (index: number) => number;
  }

  export class FixedSizeList<T = unknown> extends React.Component<FixedSizeListProps<T>> {
    scrollTo(scrollOffset: number): void;
    scrollToItem(index: number, align?: 'auto' | 'smart' | 'center' | 'end' | 'start'): void;
  }

  export class VariableSizeList<T = unknown> extends React.Component<VariableSizeListProps<T>> {
    scrollTo(scrollOffset: number): void;
    scrollToItem(index: number, align?: 'auto' | 'smart' | 'center' | 'end' | 'start'): void;
    resetAfterIndex(index: number, shouldForceUpdate?: boolean): void;
  }

  export function areEqual(
    prevProps: Readonly<ListChildComponentProps>,
    nextProps: Readonly<ListChildComponentProps>
  ): boolean;

  export function shouldComponentUpdate<T>(
    nextProps: Readonly<T>,
    nextState: Readonly<unknown>
  ): boolean;
}
