import { Trans } from '@lingui/macro'
import { Star } from '@phosphor-icons/react'
import { useResponsive } from 'ahooks'
import { useEffect } from 'react'
import { Redirect } from 'react-router-dom'

import CustomPageTitle from 'components/@ui/CustomPageTitle'
import NoLoginFavorite from 'components/@ui/NoLogin/NoLoginFavorite'
import { ProtocolFilter, ProtocolFilterProps } from 'components/@ui/ProtocolFilter'
import useInternalRole from 'hooks/features/useInternalRole'
import useGetProtocolOptions from 'hooks/helpers/useGetProtocolOptions'
import useProtocolFromUrl from 'hooks/router/useProtocolFromUrl'
import useSearchParams from 'hooks/router/useSearchParams'
import { useProtocolFilter } from 'hooks/store/useProtocolFilter'
import useTraderFavorites, { parseTraderFavoriteValue } from 'hooks/store/useTraderFavorites'
import { useAuthContext } from 'hooks/web3/useAuth'
import { TopWrapperMobile } from 'pages/@layouts/Components'
import SortTradersDropdown from 'pages/Explorer/Layouts/SortTradersDropdown'
import { TabKeyEnum } from 'pages/Explorer/Layouts/layoutConfigs'
import TimeFilterSection, { TimeFilterDropdown } from 'pages/Explorer/TimeFilterSection'
import useTradersContext, { FilterTradersProvider } from 'pages/Explorer/useTradersContext'
import Loading from 'theme/Loading'
import PageTitle from 'theme/PageTitle'
import { Box, Flex } from 'theme/base'
import { ALLOWED_COPYTRADE_PROTOCOLS, PAGE_TITLE_HEIGHT } from 'utils/config/constants'
import { generateFavoriteTradersRoute } from 'utils/helpers/generateRoute'

import ListTraderFavorites from './ListTraderFavorites'

const FavoritesPage = () => {
  const { searchParams, pathname } = useSearchParams()
  const { traderFavorites, notes, isLoading } = useTraderFavorites()
  const { isAuthenticated } = useAuthContext()
  const { md } = useResponsive()
  const isInternal = useInternalRole()
  const protocolOptions = useGetProtocolOptions()
  const allowList = isInternal ? protocolOptions.map((_p) => _p.id) : ALLOWED_COPYTRADE_PROTOCOLS

  const { selectedProtocols, checkIsSelected, handleToggle, setSelectedProtocols } = useProtocolFilter({
    defaultSelects: protocolOptions.map((_p) => _p.id),
  })
  const { protocols, protocolParams } = useProtocolFromUrl(searchParams, pathname)

  useEffect(() => {
    if (protocols) {
      setSelectedProtocols(protocols)
    }
  }, [])

  if (!isAuthenticated) return <NoLoginFavorite />
  if (isLoading)
    return (
      <Box textAlign="center" p={3} width="100%">
        <Loading />
      </Box>
    )
  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      <Redirect to={generateFavoriteTradersRoute({ params: { ...searchParams, protocol: protocolParams } })} />
      <CustomPageTitle title="Trader Favorites" />
      <TopWrapperMobile>
        <PageTitle title={<Trans>TRADER FAVORITES STATISTICS</Trans>} icon={Star} />
      </TopWrapperMobile>
      <Flex flexDirection="column" height="100%">
        {md && (
          <Flex
            height={PAGE_TITLE_HEIGHT}
            pl={3}
            sx={{
              alignItems: 'center',
              columnGap: 3,
              rowGap: 2,
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              borderBottom: 'small',
              borderColor: 'neutral4',
            }}
          >
            <PageTitle title={<Trans>TRADER FAVORITES STATISTICS</Trans>} icon={Star} />
            <ProtocolFilter
              selectedProtocols={selectedProtocols}
              handleToggleProtocol={handleToggle}
              checkIsProtocolChecked={checkIsSelected}
              allowList={allowList}
              setSelectedProtocols={setSelectedProtocols}
              placement={md ? 'bottom' : 'bottomRight'}
              menuSx={{ width: ['300px', '400px', '50vw', '50vw'] }}
            />
          </Flex>
        )}
        <Box flex="1 0 0">
          <FilterTradersProvider
            key={pathname}
            tab={TabKeyEnum.Favorite}
            accounts={traderFavorites
              .filter((value) => selectedProtocols.includes(parseTraderFavoriteValue(value).protocol))
              .map((value) => parseTraderFavoriteValue(value).address)}
          >
            <ListTraders
              notes={notes}
              protocolFilters={{
                selectedProtocols,
                handleToggleProtocol: handleToggle,
                checkIsProtocolChecked: checkIsSelected,
                setSelectedProtocols,
                allowList,
              }}
            />
          </FilterTradersProvider>
        </Box>
      </Flex>
    </Box>
  )
}

export default FavoritesPage

function ListTraders({
  notes,
  protocolFilters,
}: {
  notes: { [key: string]: string }
  protocolFilters: ProtocolFilterProps
}) {
  const contextValues = useTradersContext()
  const { md } = useResponsive()
  return (
    <Flex sx={{ width: '100%', height: '100%', flexDirection: 'column' }}>
      <Box flex="1 1 0" sx={{ borderBottom: 'small', borderBottomColor: 'neutral4' }}>
        {md ? (
          <TimeFilterSection contextValues={contextValues} />
        ) : (
          <Flex sx={{ height: 40, alignItems: 'center', pl: 3, pr: [3, 3, 0], justifyContent: 'space-between' }}>
            <TimeFilterDropdown contextValues={contextValues} />
            <Flex sx={{ height: '100%' }}>
              <Flex sx={{ height: '100%', alignItems: 'center', borderLeft: 'small', borderLeftColor: 'neutral4' }}>
                <SortTradersDropdown
                  currentSort={contextValues.currentSort}
                  changeCurrentSort={contextValues.changeCurrentSort}
                />
                <ProtocolFilter
                  {...protocolFilters}
                  placement={md ? 'bottom' : 'bottomRight'}
                  menuSx={{ width: ['300px', '400px', '50vw', '50vw'] }}
                />
              </Flex>
            </Flex>
          </Flex>
        )}
      </Box>
      <ListTraderFavorites contextValues={contextValues} notes={notes} />
    </Flex>
  )
}
