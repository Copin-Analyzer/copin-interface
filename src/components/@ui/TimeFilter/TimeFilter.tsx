import { ReactNode } from 'react'

import TabItem from 'theme/Tab/TabItem'
import { Flex } from 'theme/base'

import { TIME_FILTER_OPTIONS } from './constants'

export default function TimeFilter<T extends { id: unknown; text: ReactNode }>({
  currentFilter,
  handleFilterChange,
  options = TIME_FILTER_OPTIONS as unknown as T[],
  sx = {},
}: {
  currentFilter: T | null
  handleFilterChange: (sort: T) => void
  options?: T[]
  sx?: any
}) {
  return (
    <Flex alignItems="center" sx={{ '& > button:first-child': { pl: 0 }, '& > button:last-child': { pr: 0 }, ...sx }}>
      {/* {options.map((option, index: number) => (
        <Button
          type="button"
          variant="ghost"
          key={index}
          onClick={() => handleFilterChange(option)}
          width="fit-content"
          sx={{
            color: currentFilter && currentFilter.id === option.id ? 'neutral1' : 'neutral3',
            fontWeight: 'normal',
            // borderBottom: currentFilter && currentFilter.id === option.id ? 'small' : 'none',
            // borderColor: 'primary1',
            // backgroundColor: currentFilter && currentFilter.id === option.id ? 'neutral3' : 'transparent',
            padding: 0,
            px: ['1px', 1, 1, 1],
            height: '24px',
            borderRadius: '0',
            flexShrink: 0,
            '&:hover:not(:disabled),&:active:not(:disabled)': {
              color: 'neutral1',
            },
          }}
        >
          {option.text}
        </Button>
      ))} */}

      {options.map((option, index: number) => (
        <TabItem
          active={!!currentFilter && currentFilter.id === option.id}
          onClick={() => handleFilterChange(option)}
          key={index}
          sx={{ px: ['6px', '6px', '8px', '8px'] }}
        >
          {option.text}
        </TabItem>
      ))}
    </Flex>
  )
}
