import { useResponsive } from 'ahooks'
import dayjs from 'dayjs'
import {
  CandlestickData,
  ColorType,
  CrosshairMode,
  LineData,
  LineStyle,
  PriceScaleMode,
  SeriesMarker,
  Time,
  createChart,
} from 'lightweight-charts'
import { useEffect, useMemo, useState } from 'react'
import { useQuery } from 'react-query'

import { getChartDataV2 } from 'apis/positionApis'
import { CopyOrderData, CopyPositionData } from 'entities/copyTrade.d'
import useGetUsdPrices from 'hooks/helpers/useGetUsdPrices'
import Loading from 'theme/Loading'
import { Box } from 'theme/base'
import { themeColors } from 'theme/colors'
import { FONT_FAMILY } from 'utils/config/constants'
import { PositionStatusEnum } from 'utils/config/enums'
import { CopyTradePlatformEnum } from 'utils/config/enums'
import { QUERY_KEYS } from 'utils/config/keys'
import { TIMEFRAME_NAMES } from 'utils/config/trades'
import { calcCopyLiquidatePrice, calcCopyOpeningPnL, calcPnL, calcSLTPUsd } from 'utils/helpers/calculate'
import { formatNumber } from 'utils/helpers/format'
import {
  formatCopyPositionChartData,
  getSymbolFromPair,
  getTimeframeFromTimeRange,
  normalizeExchangePrice,
} from 'utils/helpers/transform'

import CopyOrderTooltip from './CopyOrderTooltip'

export default function CopyChartProfit({
  exchange,
  position,
  copyOrders,
  isOpening,
  openBlockTime,
  closeBlockTime,
  setCrossMovePnL,
}: {
  exchange?: CopyTradePlatformEnum
  position: CopyPositionData
  copyOrders: CopyOrderData[]
  isOpening: boolean
  openBlockTime: number
  closeBlockTime: number
  setCrossMovePnL: (value: number | undefined) => void
}) {
  const { getPricesData } = useGetUsdPrices()
  const prices = getPricesData({ protocol: position.protocol })
  const { sm } = useResponsive()
  const [markerId, setMarkerId] = useState<string | undefined>()
  const tokenSymbol = getSymbolFromPair(position.pair)
  const from = openBlockTime * 1000
  const to = useMemo(() => (isOpening ? dayjs().utc().valueOf() : closeBlockTime * 1000), [closeBlockTime, isOpening])
  const timeframe = useMemo(() => getTimeframeFromTimeRange(from, to), [from, to])
  const { data, isLoading } = useQuery(
    [QUERY_KEYS.GET_CHART_DATA, tokenSymbol, from, to, timeframe],
    () =>
      getChartDataV2({
        symbol: tokenSymbol,
        timeframe,
        from: dayjs(from).utc().subtract(timeframe, 'minutes').valueOf(),
        to: dayjs(to)
          .utc()
          .add(isOpening ? 0 : timeframe, 'minutes')
          .valueOf(),
      }),
    {
      enabled: !!tokenSymbol && ((isOpening && openBlockTime > 0) || (!isOpening && closeBlockTime > 0)),
      retry: 0,
      select(data) {
        return formatCopyPositionChartData({ symbol: tokenSymbol, data, exchange })
      },
    }
  )

  const orders = copyOrders.sort((x, y) => (x.createdAt < y.createdAt ? -1 : x.createdAt > y.createdAt ? 1 : 0))
  const openOrder = orders && orders.length > 0 ? orders[0] : undefined
  const increaseList = orders.filter((e) => e.isIncrease)
  const decreaseList = orders.filter((e) => !e.isIncrease)
  const currentOrder = orders.find((e) => e.createdAt === markerId)
  const timezone = useMemo(() => new Date().getTimezoneOffset() * 60, [])
  const chartData: LineData[] = useMemo(() => {
    if (!data) return []
    const tempData = [...data]

    if (openOrder) {
      tempData.push({
        open: openOrder.price,
        close: openOrder.price,
        high: openOrder.price,
        low: openOrder.price,
        timestamp: dayjs(openOrder.createdAt).utc().valueOf(),
      })
    }

    if (isOpening) {
      const symbol = getSymbolFromPair(position.pair)
      const currentPrice = prices[symbol]
      if (currentPrice) {
        tempData.push({
          open: normalizeExchangePrice({ protocolSymbol: tokenSymbol, protocolSymbolPrice: currentPrice, exchange }),
          close: normalizeExchangePrice({ protocolSymbol: tokenSymbol, protocolSymbolPrice: currentPrice, exchange }),
          high: normalizeExchangePrice({ protocolSymbol: tokenSymbol, protocolSymbolPrice: currentPrice, exchange }),
          low: normalizeExchangePrice({ protocolSymbol: tokenSymbol, protocolSymbolPrice: currentPrice, exchange }),
          timestamp: to,
        })
      }
    } else {
      tempData.push({
        open: position.closePrice ?? position.entryPrice ?? 0,
        close: position.closePrice ?? position.entryPrice ?? 0,
        high: position.closePrice ?? position.entryPrice ?? 0,
        low: position.closePrice ?? position.entryPrice ?? 0,
        timestamp: dayjs(position.lastOrderAt).utc().valueOf(),
      })
    }

    const chartData = !isOpening
      ? tempData.filter(
          (e) =>
            e.timestamp >= dayjs(openOrder?.createdAt).utc().valueOf() &&
            e.timestamp <= tempData[tempData.length - 1].timestamp
        )
      : tempData.filter((e) => e.timestamp >= dayjs(openOrder?.createdAt).utc().valueOf())
    return (
      chartData
        .map((e, index) => {
          const marketPrice = e.close
          const tickTime = dayjs(e.timestamp).utc()
          const realSize =
            index === chartData.length - 1
              ? Number(position.sizeDelta) * (position.entryPrice ?? 0)
              : orders.reduce((sum, item) => {
                  const orderTime = dayjs(item.createdAt).utc()
                  return tickTime.isAfter(orderTime) || tickTime.isSame(orderTime)
                    ? sum + (item.isIncrease ? 1 : -1) * item.size * item.price
                    : sum
                }, 0)
          const filterOrders = orders.filter((e) => dayjs(e.createdAt).isBefore(tickTime))
          const averagePrice =
            index !== chartData.length - 1 && filterOrders && filterOrders.length > 0
              ? filterOrders.reduce(function (sum, value) {
                  return sum + value.price
                }, 0) / filterOrders.length
              : position.entryPrice
          const pnl = calcPnL(!!position.isLong, averagePrice, marketPrice, realSize)

          return {
            value: !isOpening && index === chartData.length - 1 ? position.pnl : pnl,
            time: tickTime.unix() - timezone,
          } as LineData
        })
        .sort((x, y) => (x.time < y.time ? -1 : x.time > y.time ? 1 : 0)) ?? []
    )
  }, [data, openOrder, orders, prices, timezone, to, exchange])

  const priceData: CandlestickData[] = useMemo(() => {
    if (!data) return []
    const tempData = [...data]
    // const lastData = isOpening ? data[data.length - 1] : tempData.pop()
    if (openOrder) {
      tempData.push({
        open: openOrder.price,
        close: openOrder.price,
        high: openOrder.price,
        low: openOrder.price,
        timestamp: dayjs(openOrder.createdAt).utc().valueOf(),
      })
    }
    if (isOpening) {
      const symbol = getSymbolFromPair(position.pair)
      const currentPrice = prices[symbol]
      if (currentPrice) {
        tempData.push({
          open: currentPrice,
          close: currentPrice,
          low: currentPrice,
          high: currentPrice,
          timestamp: to,
        })
      }
    } else {
      tempData.push({
        open: position.closePrice ?? position.entryPrice ?? 0,
        close: position.closePrice ?? position.entryPrice ?? 0,
        high: position.closePrice ?? position.entryPrice ?? 0,
        low: position.closePrice ?? position.entryPrice ?? 0,
        timestamp: dayjs(position.createdAt).utc().valueOf(),
      })
    }

    return (
      tempData
        .filter((e) => e.timestamp >= dayjs(openOrder?.createdAt).utc().valueOf())
        .map((e) => {
          return {
            open: e.open,
            close: e.close,
            low: e.low,
            high: e.high,
            time: dayjs(e.timestamp).utc().unix() - timezone,
          } as CandlestickData
        })
        .sort((x, y) => (x.time < y.time ? -1 : x.time > y.time ? 1 : 0)) ?? []
    )
  }, [
    data,
    isOpening,
    openOrder,
    position.closePrice,
    position.createdAt,
    position.entryPrice,
    position.indexToken,
    prices,
    timezone,
    to,
  ])

  useEffect(() => {
    if (isLoading || !data) return

    const chartHeight = sm ? 220 : 150
    const container = document.getElementById('chart-container')
    const chart = createChart(container ? container : 'chart-container', {
      height: chartHeight,
      rightPriceScale: {
        autoScale: true,
        visible: false,
        mode: PriceScaleMode.Normal,
      },
      leftPriceScale: {
        visible: false,
        autoScale: true,
        mode: PriceScaleMode.Normal,
      },
      handleScale: false,
      handleScroll: false,
      grid: {
        horzLines: {
          color: '#eee',
          visible: false,
        },
        vertLines: {
          color: 'transparent',
          visible: false,
        },
      },
      overlayPriceScales: {
        borderVisible: false,
      },
      layout: {
        textColor: themeColors.neutral3,
        background: { type: ColorType.Solid, color: 'transparent' },
        fontFamily: FONT_FAMILY,
        fontSize: 12,
        attributionLogo: false,
      },
      timeScale: {
        rightOffset: 0,
        secondsVisible: true,
        timeVisible: true,
        rightBarStaysOnScroll: true,
        lockVisibleTimeRangeOnResize: true,
      },
      crosshair: {
        mode: CrosshairMode.Magnet,
        horzLine: {
          // visible: false,
          labelBackgroundColor: '#B1B5C3',
          // labelVisible: false,
          color: 'rgba(119, 126, 144, 0.8)',
          width: 1,
          style: LineStyle.Dotted,
        },
        vertLine: {
          color: 'rgba(119, 126, 144, 0.8)',
          labelBackgroundColor: '#353945',
          width: 1,
          style: LineStyle.Dotted,
        },
      },
    })
    chart.timeScale().fitContent()
    chart.timeScale().applyOptions({})

    const priceSeries = chart.addCandlestickSeries({
      priceScaleId: 'right',
      upColor: themeColors.neutral4,
      downColor: 'transparent',
      borderDownColor: themeColors.neutral4,
      borderUpColor: themeColors.neutral4,
      wickDownColor: themeColors.neutral4,
      wickUpColor: themeColors.neutral4,
      priceLineVisible: false,
      lastValueVisible: false,
    })
    priceSeries.setData(priceData)
    priceSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.1,
        bottom: 0.1,
      },
    })

    const series = chart.addBaselineSeries({
      priceScaleId: 'left',
      topLineColor: themeColors.green1,
      bottomLineColor: themeColors.red2,
      baseValue: {
        type: 'price',
        price: 0,
      },
      baseLineStyle: LineStyle.Dashed,
      lineWidth: 2,
      baseLineColor: 'red',
      baseLineVisible: false,
      lastValueVisible: false,
      priceLineVisible: false,
      // disabling built-in price lines
    })
    series.setData(chartData)

    const high =
      chartData[
        chartData.reduce(
          (seed, b, idx) => (b.value > chartData[seed].value ? idx : seed),
          Math.min(6, chartData.length - 1)
        )
      ]
    const low = chartData[chartData.reduce((seed, b, idx) => (b.value <= chartData[seed].value ? idx : seed), 0)]
    if (high && low && high.value > 0 && low.value < 0) {
      series.createPriceLine({
        price: 0,
        color: 'rgba(119, 126, 144, 0.25)',
        lineWidth: 1,
        lineVisible: true,
        axisLabelVisible: true,
        title: '',
        lineStyle: LineStyle.Solid,
      })
    }
    if (low && low.value < 0 && position.status === PositionStatusEnum.OPEN) {
      const liquidationPrice = calcCopyLiquidatePrice(position)
      const posDelta = calcCopyOpeningPnL(position, liquidationPrice)
      if (posDelta) {
        series.createPriceLine({
          price: posDelta,
          color: themeColors.red2,
          lineVisible: true,
          lineWidth: 1,
          axisLabelVisible: true,
          title: `Liquidation ${posDelta < 0 ? '-' : ''}$${formatNumber(Math.abs(posDelta), 2)}`,
          lineStyle: LineStyle.SparseDotted,
        })
      }
    }
    if (position.latestStopLossId && position.stopLossAmount) {
      const stopLossUsd = calcSLTPUsd(position.stopLossAmount, position.stopLossPrice, position.entryPrice)
      const minChartValue = Number(series.coordinateToPrice(Math.max(chartHeight - 30))?.toString())
      const value =
        low?.value === undefined
          ? minChartValue
          : -stopLossUsd < low.value
          ? Math.min(minChartValue, low.value)
          : -stopLossUsd
      series.createPriceLine({
        price: value,
        color: themeColors.orange1,
        lineVisible: true,
        lineWidth: 1,
        axisLabelVisible: true,
        title: `SL: -$${formatNumber(stopLossUsd, 2)}${
          position.stopLossPrice ? ' - Est. Price: ' + formatNumber(position.stopLossPrice) : ''
        }`,
        lineStyle: LineStyle.SparseDotted,
      })
    }
    if (position.latestTakeProfitId && position.takeProfitAmount) {
      const takeProfitUsd = calcSLTPUsd(position.takeProfitAmount, position.takeProfitPrice, position.entryPrice)
      const maxChartValue = Number(series.coordinateToPrice(20)?.toString())
      const value =
        high === undefined
          ? maxChartValue
          : takeProfitUsd > high.value
          ? Math.max(maxChartValue, high.value)
          : takeProfitUsd

      series.createPriceLine({
        price: value,
        color: themeColors.green1,
        lineVisible: true,
        lineWidth: 1,
        axisLabelVisible: true,
        title: `TP: $${formatNumber(takeProfitUsd, 2)}${
          position.takeProfitPrice ? ' - Est. Price: ' + formatNumber(position.takeProfitPrice) : ''
        }`,
        lineStyle: LineStyle.SparseDotted,
      })
    }

    if (chartData.length > 0) {
      if (high && low && low.value !== high.value) {
        const increaseMarkers = increaseList.slice(1).map((order): SeriesMarker<Time> => {
          return {
            id: order.createdAt,
            color: themeColors.neutral2,
            position: 'aboveBar',
            shape: 'arrowUp',
            time: (dayjs(order.createdAt).utc().unix() - timezone) as Time,
            text: '$' + formatNumber(order.collateral, 2, 2),
          }
        })
        const decreaseMarkers = (isOpening ? decreaseList : decreaseList.slice(0, -1)).map(
          (order): SeriesMarker<Time> => {
            return {
              id: order.createdAt,
              color: themeColors.neutral2,
              position: 'belowBar',
              shape: 'arrowDown',
              time: (dayjs(order.createdAt).utc().unix() - timezone) as Time,
              text: '$' + formatNumber(order.collateral, 2, 2),
            }
          }
        )

        const makers = [...increaseMarkers, ...decreaseMarkers]
        series.setMarkers(makers.sort((a, b) => Number(a.time) - Number(b.time)))
        series.priceScale().applyOptions({
          scaleMargins: {
            top: 0.14,
            bottom: 0.14,
          },
        })

        chart.timeScale().fitContent()
      }
    }

    const legend = document.getElementById('legend-profit') ?? document.createElement('div')
    legend.setAttribute('id', 'legend-profit')
    if (container && legend) {
      legend.style.position = 'absolute'
      legend.style.left = '0px'
      legend.style.top = sm ? '-24px' : '-8px'
      legend.style.zIndex = '1'
      legend.style.fontSize = '10px'
      legend.style.fontFamily = FONT_FAMILY
      legend.style.lineHeight = '12px'
      legend.style.color = themeColors.neutral3
      legend.style.display = 'none'
      container.appendChild(legend)
    }

    chart.subscribeCrosshairMove((param) => {
      const hoverMakerId = param.hoveredObjectId as string | undefined
      setMarkerId(hoverMakerId)

      const data = param.seriesData.get(series) as LineData
      setCrossMovePnL(data?.value)

      if (container && legend) {
        if (
          param.point === undefined ||
          !param.time ||
          param.point.x < 0 ||
          param.point.x > container.clientWidth ||
          param.point.y < 0 ||
          param.point.y > container.clientHeight
        ) {
          legend.style.display = 'none'
        } else {
          const candleData = param.seriesData.get(priceSeries) as CandlestickData
          if (candleData && candleData.time) {
            legend.innerHTML = `<div style="font-size: 12px; margin: 1px 0;">O: <span>${formatNumber(
              candleData.open
            )}</span> | H: <span>${formatNumber(candleData.high)}</span> | L: <span>${formatNumber(
              candleData.low
            )}</span> | C: <span>${formatNumber(candleData.close)} (${TIMEFRAME_NAMES[timeframe]})</span></div>`
            legend.style.display = 'block'
          }
        }
      }
    })

    const handleResize = () => {
      if (container) {
        chart.applyOptions({
          width: container.offsetWidth,
          height: container.offsetHeight,
        })
      }
    }

    const handleResetFocus = () => {
      setCrossMovePnL(undefined)
    }

    window.addEventListener('resize', handleResize)
    container?.addEventListener('mouseout', handleResetFocus)

    return () => {
      window.removeEventListener('resize', handleResize)
      container?.removeEventListener('mouseout', handleResetFocus)

      chart.remove()
    }
  }, [chartData, data, priceData, prices])

  return (
    <Box mt={[1, 24]} sx={{ position: 'relative' }} minHeight={[150, 220]}>
      <div id="legend-profit" />
      {currentOrder && <CopyOrderTooltip data={currentOrder} />}
      {isLoading ? <Loading /> : <div id="chart-container" />}
    </Box>
  )
}
