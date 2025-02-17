import AlquilerIcon from "@/assets/images/icons/categories/gastos/alquiler.svg";
import BusIcon from "@/assets/images/icons/categories/gastos/bus.svg";
import TijeraIcon from "@/assets/images/icons/categories/gastos/tijera.svg";
import GraficaAbajoIcon from "@/assets/images/icons/categories/gastos/graficaabajo.svg";
import HogarIcon from "@/assets/images/icons/categories/gastos/hogar.svg";
import EnsaladaIcon from "@/assets/images/icons/categories/gastos/ensalada.svg";
import SaludIcon from "@/assets/images/icons/categories/gastos/salud.svg";
import SuperIcon from "@/assets/images/icons/categories/gastos/super.svg";
import TelefonoIcon from "@/assets/images/icons/categories/gastos/telefono.svg";
import EmpleoIcon from "@/assets/images/icons/categories/ingresos/empleo.svg";
import TrabajoIndepIcon from "@/assets/images/icons/categories/ingresos/trabajoindependiente.svg";
import DirectorIcon from "@/assets/images/icons/categories/ingresos/director.svg";
import AirbnbIcon from "@/assets/images/icons/categories/ingresos/airbnb.svg";
import BolsaIcon from "@/assets/images/icons/categories/ingresos/bolsa.svg";
import OtrosIngresosIcon from "@/assets/images/icons/categories/ingresos/otrosingresos.svg";
import SavingMoneyIcon from "@/assets/images/icons/categories/ingresos/savingmoney.svg";
import AddIcon from "@/assets/images/icons/Add.svg";

// 📌 Mapeo de iconos por categoría y tipo de transacción
export const gastosIcons: Record<string, JSX.Element> = {
	"Alquiler": <AlquilerIcon width={30} height={30} />,
	"Transporte": <BusIcon width={30} height={30} />,
	"Deducibles": <TijeraIcon width={30} height={30} />,
	"Otros": <GraficaAbajoIcon width={30} height={30} />,
	"Hogar": <HogarIcon width={30} height={30} />,
	"Comida": <EnsaladaIcon width={30} height={30} />,
	"Salud": <SaludIcon width={30} height={30} />,
	"Super": <SuperIcon width={30} height={30} />,
	"Teléfono": <TelefonoIcon width={30} height={30} />,
};

export const addIcon = <AddIcon width={30} height={30} />;

export const ingresosIcons: Record<string, JSX.Element> = {
	"Empleo": <EmpleoIcon width={30} height={30} />,
	"Trabajo Independiente": <TrabajoIndepIcon width={30} height={30} />,
	"Alquiler": <AlquilerIcon width={30} height={30} />,
	"Intereses": <SavingMoneyIcon width={30} height={30} />,
	"Director": <DirectorIcon width={30} height={30} />,
	"Airbnb": <AirbnbIcon width={30} height={30} />,
	"Bolsa": <BolsaIcon width={30} height={30} />,
	"Otros Ingresos": <OtrosIngresosIcon width={30} height={30} />,
};

// 📌 Función para obtener el ícono correcto según tipo y categoría
export const getTransactionIcon = (category: string, type: string) => {
	if (type === "gasto") return gastosIcons[category] || <GraficaAbajoIcon width={30} height={30} />;
	if (type === "ingreso") return ingresosIcons[category] || <OtrosIngresosIcon width={30} height={30} />;
	return <GraficaAbajoIcon width={30} height={30} />; // Default
};
