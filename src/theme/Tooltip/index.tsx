import { ComponentProps } from 'react'
import { Tooltip as ReactTooltip } from 'react-tooltip'

// function Tooltip(props: any) {
function Tooltip(props: ComponentProps<typeof ReactTooltip>) {
  return (
    // <BodyPortal>
    <ReactTooltip
      variant="dark"
      place="top"
      globalCloseEvents={{ scroll: true }}
      positionStrategy="fixed"
      className="custom_react_tooltip_css"
      classNameArrow={
        props.place === 'bottom'
          ? 'custom_react_tooltip_arrow_place_bottom_css'
          : 'custom_react_tooltip_arrow_place_top_css'
      }
      {...props}
    >
      {props.children}
    </ReactTooltip>
    // </BodyPortal>
  )
}

export default Tooltip
