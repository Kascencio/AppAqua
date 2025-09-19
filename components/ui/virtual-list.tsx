"use client"

import * as React from "react"
import { FixedSizeList as List, VariableSizeList } from "react-window"
import { cn } from "@/lib/utils"

interface VirtualListProps<T> {
  items: T[]
  height: number
  itemHeight: number | ((index: number) => number)
  renderItem: (props: { index: number; style: React.CSSProperties; data: T }) => React.ReactNode
  className?: string
  overscan?: number
  onScroll?: (props: { scrollDirection: "forward" | "backward"; scrollOffset: number }) => void
}

export function VirtualList<T>({
  items,
  height,
  itemHeight,
  renderItem,
  className,
  overscan = 5,
  onScroll,
}: VirtualListProps<T>) {
  const isVariableHeight = typeof itemHeight === "function"

  const ItemRenderer = React.useCallback(
    ({ index, style }: { index: number; style: React.CSSProperties }) => {
      const item = items[index]
      return renderItem({ index, style, data: item })
    },
    [items, renderItem],
  )

  if (isVariableHeight) {
    return (
      <VariableSizeList
        className={cn("scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100", className)}
        height={height}
        itemCount={items.length}
        itemSize={itemHeight as (index: number) => number}
        overscanCount={overscan}
        onScroll={onScroll}
      >
        {ItemRenderer}
      </VariableSizeList>
    )
  }

  return (
    <List
      className={cn("scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100", className)}
      height={height}
      itemCount={items.length}
      itemSize={itemHeight as number}
      overscanCount={overscan}
      onScroll={onScroll}
    >
      {ItemRenderer}
    </List>
  )
}
