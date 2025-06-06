import GraphicIcon from "@/app/components/ui/icons/Graphics";
import HomeIcon from "@/app/components/ui/icons/Home";
import MovementsIcon from "@/app/components/ui/icons/Movements";
import ProfileIcon from "@/app/components/ui/icons/Profile";
import { Path, Svg, SvgProps } from "react-native-svg";

interface SvgProps_ extends SvgProps {
  backgroundcolor: string
}

export const icon = {
  index: (props: SvgProps_) => <HomeIcon {...props} />,
  movements: (props: SvgProps_) => <MovementsIcon {...props} />,
  board: (props: SvgProps_) => <GraphicIcon {...props} />,
  profile: (props: SvgProps_) => <ProfileIcon {...props} />,
  add: (props: SvgProps_) => (
    <Svg width={24} height={24} viewBox="0 0 24 24" {...props}>
      <Path d="M12 5v14m-7-7h14" stroke="#FFF" strokeWidth={2} />
    </Svg>
  ),
};

