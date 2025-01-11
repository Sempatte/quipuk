// HomeIcon.tsx
import React from "react";
import Svg, { Path } from "react-native-svg";
import { SvgProps } from "react-native-svg";

const MovementsIcon: React.FC<SvgProps> = ({
  color = "#222",
  width = 24,
  height = 24,
  ...props
}) => (
  <Svg
    width="30"
    height="32"
    viewBox="0 0 30 32"
    fill="none"
  >
    <Path
      d="M1 9H26.2M20.6 2L27.6 9L20.6 16M29 23H3.8M9.4 16L2.4 23L9.4 30"
      stroke="#060606"
      stroke-width="3"
    />
  </Svg>
);

export default MovementsIcon;
