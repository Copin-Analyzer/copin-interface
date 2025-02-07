import { Trans } from '@lingui/macro'
import { ArrowSquareOut } from '@phosphor-icons/react'
import React, { Fragment } from 'react'

import ButtonWithIcon from 'theme/Buttons/ButtonWithIcon'
import { Box, Flex, Li, Type } from 'theme/base'
import { BoxProps } from 'theme/types'
import { LINKS } from 'utils/config/constants'

const WalletHelpOkx = ({
  hasBorder = false,
  isList = false,
  ...props
}: BoxProps & { hasBorder?: boolean; isList?: boolean }) => {
  const Wrapper = isList ? Li : Fragment

  return (
    <Flex flexDirection="column" sx={{ gap: 2 }} {...props}>
      <Wrapper>
        <Box
          sx={{
            ...(hasBorder
              ? { p: 2, border: 'small', bg: 'neutral4', borderColor: 'neutral4', borderRadius: 'sm' }
              : {}),
          }}
        >
          <Flex sx={{ alignItems: 'center', gap: 2 }}>
            <Type.Caption>
              <Trans>Don’t have a OKX account?</Trans>
            </Type.Caption>
            <Type.Caption>-</Type.Caption>
            <ButtonWithIcon
              type="button"
              variant="ghostPrimary"
              as="a"
              href={LINKS.registerOKX}
              target="_blank"
              direction="right"
              icon={<ArrowSquareOut size={16} />}
              sx={{ mx: 0, p: 0, fontSize: '12px', lineHeight: '18px' }}
            >
              <Trans>Register</Trans>
            </ButtonWithIcon>
          </Flex>
          {/*<Type.Caption color="neutral3">*/}
          {/*  <Trans>Get extra benefits with referral code:</Trans>{' '}*/}
          {/*  <CopyButton*/}
          {/*    value={'75651458'}*/}
          {/*    sx={{*/}
          {/*      backgroundColor: 'transparent',*/}
          {/*      display: 'inline-block',*/}
          {/*      color: 'neutral1',*/}
          {/*      '&:hover': {*/}
          {/*        color: 'neutral2',*/}
          {/*        '.icon_wrapper': { color: 'primary2' },*/}
          {/*      },*/}
          {/*      p: 0,*/}
          {/*      '& *': { fontWeight: 700 },*/}
          {/*      '& .icon_wrapper': { color: 'primary1' },*/}
          {/*    }}*/}
          {/*  >*/}
          {/*    75651458*/}
          {/*  </CopyButton>*/}
          {/*</Type.Caption>*/}
        </Box>
      </Wrapper>

      <Wrapper>
        <Flex alignItems="center" sx={{ gap: 2 }}>
          <Type.Caption>
            <Trans>How to connect your OKX API to Copin?</Trans>
          </Type.Caption>
          <Type.Caption>-</Type.Caption>
          <ButtonWithIcon
            type="button"
            variant="ghostPrimary"
            as="a"
            href={LINKS.getOKXAPIKey}
            target="_blank"
            direction="right"
            icon={<ArrowSquareOut size={16} />}
            sx={{ mx: 0, p: 0, fontSize: '12px', lineHeight: '18px' }}
          >
            <Trans>Learn how?</Trans>
          </ButtonWithIcon>
        </Flex>
      </Wrapper>
    </Flex>
  )
}

export default WalletHelpOkx
