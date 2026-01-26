"use client"

import * as React from "react"
import { FixedSizeList as List, VariableSizeList, type ListOnScrollProps, type ListChildComponentProps } from "react-window"
import { cn } from "@/lib/utils"

const FixedList = List as unknown as React.ComponentType<any>
const VariableList = VariableSizeList as unknown as React.ComponentType<any>

interface VirtualListProps<T> {
  items: T[]
  height: number
  itemHeight: number | ((index: number) => number)
  renderItem: (props: { index: number; style: React.CSSProperties; data: T }) => React.ReactNode
  className?: string
  overscan?: number
  onScroll?: (props: ListOnScrollProps) => void
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
    ({ index, style, data }: ListChildComponentProps<T[]>) => {
      const item = data[index]
      return renderItem({ index, style, data: item })
    },
    [renderItem],
  )

  if (isVariableHeight) {
    return (
      <VariableList
        className={cn("scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100", className)}
        height={height}
        itemCount={items.length}
        itemData={items}
        itemSize={itemHeight as (index: number) => number}
        overscanCount={overscan}
        onScroll={onScroll}
      >
        {ItemRenderer}
      </VariableList>
    )
  }

  return (
    <FixedList
      className={cn("scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100", className)}
      height={height}
      itemCount={items.length}
      itemData={items}
      itemSize={itemHeight as number}
      overscanCount={overscan}
      onScroll={onScroll}
    >
      {ItemRenderer}
    </FixedList>
  )
}
