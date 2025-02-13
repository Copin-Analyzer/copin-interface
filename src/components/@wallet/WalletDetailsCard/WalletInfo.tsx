// eslint-disable-next-line no-restricted-imports
import { Trans } from '@lingui/macro'
import React, { ReactNode, useMemo } from 'react'

import ExplorerLogo from 'components/@ui/ExplorerLogo'
import Logo from 'components/@ui/Logo'
import { ApiKeyWallet, CopyWalletData } from 'entities/copyWallet'
import CopyButton from 'theme/Buttons/CopyButton'
import Tooltip from 'theme/Tooltip'
import { Box, Flex, IconBox, Type } from 'theme/base'
import { SxProps } from 'theme/types'
import { CopyTradePlatformEnum } from 'utils/config/enums'
import { EXPLORER_PLATFORMS } from 'utils/config/platforms'
import { addressShorten, formatNumber } from 'utils/helpers/format'
import { generateTraderDetailsRoute } from 'utils/helpers/generateRoute'
import { getExchangeKey } from 'utils/helpers/transform'
import { getCopyTradePlatformProtocol } from 'utils/web3/dcp'

interface WalletInfoProps {
  data: CopyWalletData
  hiddenBalance?: boolean
  showFund?: boolean
}
export default function WalletInfo({ data, hiddenBalance, showFund = true, sx }: WalletInfoProps & SxProps) {
  const walletKey = useMemo(
    () => data?.smartWalletAddress ?? (data?.[getExchangeKey(data?.exchange)] as ApiKeyWallet)?.apiKey ?? '',
    [data]
  )

  return (
    <Box alignItems="center" flexWrap="wrap" sx={{ gap: [2, 3], ...sx }}>
      <InfoItem
        label={!!data.smartWalletAddress ? 'Smart Wallet' : 'API Key'}
        value={
          <Flex sx={{ gap: 2 }} alignItems="center">
            <Type.CaptionBold
              data-tip="React-tooltip"
              data-tooltip-id={`tt-${walletKey}`}
              data-tooltip-delay-show={360}
            >
              {addressShorten(walletKey)}
            </Type.CaptionBold>
            <CopyButton
              variant="ghost"
              size="xs"
              value={walletKey}
              iconSize={16}
              sx={{
                transition: 'none',
                p: 0,
              }}
            ></CopyButton>
            <Tooltip id={`tt-${walletKey}`} clickable={false}>
              <Type.Small sx={{ maxWidth: [300, 400] }}>{walletKey}</Type.Small>
            </Tooltip>
            {!!data.smartWalletAddress && (
              <ExplorerLogo
                size={20}
                exchange={data.exchange}
                explorerUrl={`${EXPLORER_PLATFORMS[data.exchange]}/address/${data.smartWalletAddress}`}
              />
            )}
            {!!data.smartWalletAddress && data.exchange === CopyTradePlatformEnum.GNS_V8 && (
              <IconBox
                as={'a'}
                href={generateTraderDetailsRoute(getCopyTradePlatformProtocol(data.exchange), data.smartWalletAddress)}
                target="_blank"
                icon={<Logo size={16} />}
              />
            )}

            {/* <WatcherLogo
                platform={data.exchange}
                watcherUrl={`${WATCHER_PLATFORMS[data.exchange]}/${data.smartWalletAddress}`}
              /> */}
          </Flex>
        }
      />
      {showFund && (
        <InfoItem
          label={<Trans>Available / Total Fund</Trans>}
          value={
            hiddenBalance
              ? '*****'
              : `${data.availableBalance ? `$${formatNumber(data.availableBalance)}` : '--'} / ${
                  data.balance ? `$${formatNumber(data.balance)}` : '--'
                }`
          }
        />
      )}
    </Box>
  )
}

interface InfoItemProps {
  label: ReactNode
  value: ReactNode
  width?: string | string[]
}

function InfoItem({ label, value, width }: InfoItemProps) {
  return (
    <Flex width={width} sx={{ gap: 2, mr: 3 }}>
      <Type.Caption color="neutral3">{label}</Type.Caption>
      {typeof value === 'string' ? <Type.CaptionBold color="neutral1">{value}</Type.CaptionBold> : value}
    </Flex>
  )
}

function WalletKey({ walletKey, isSmartWallet, sx }: { walletKey?: string; isSmartWallet?: boolean; sx?: any }) {
  return (
    <Flex width={250} sx={{ gap: 2, flexShrink: 0, '& *': { flexShrink: 0 }, ...(sx || {}) }}>
      <Type.Caption color="neutral3">{isSmartWallet ? 'Smart Wallet' : 'API Key'}:</Type.Caption>
      <Flex sx={{ gap: 2 }} alignItems="center">
        <Type.CaptionBold data-tip="React-tooltip" data-tooltip-id={`tt-${walletKey}`} data-tooltip-delay-show={360}>
          {walletKey ? addressShorten(walletKey, 4) : '--'}
        </Type.CaptionBold>
        {!!walletKey && (
          <CopyButton
            variant="ghost"
            size="xs"
            value={walletKey}
            iconSize={16}
            sx={{
              transition: 'none',
              p: 0,
            }}
          ></CopyButton>
        )}
        <Tooltip id={`tt-${walletKey}`} clickable={false}>
          <Type.Small sx={{ maxWidth: [300, 400] }}>{walletKey}</Type.Small>
        </Tooltip>
      </Flex>
    </Flex>
  )
}
