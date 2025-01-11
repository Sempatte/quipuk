import GraphicIcon from "@/components/ui/icons/Graphics";
import HomeIcon from "@/components/ui/icons/Home";
import MovementsIcon from "@/components/ui/icons/Movements";
import ProfileIcon from "@/components/ui/icons/Profile";
import { SvgProps } from "react-native-svg";

export const icon = {
    index: (props: SvgProps) => <HomeIcon {...props} />,
    movements: (props: SvgProps) => <MovementsIcon {...props}/>,
    graphics : (props: SvgProps) => <GraphicIcon {...props}/>,
    profile : (props: SvgProps) => <ProfileIcon {...props}/>
  }