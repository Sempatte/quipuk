// constants/countries.ts
export interface Country {
  name: string;
  code: string;
  dialCode: string;
  flag: string;
}

export const countries: Country[] = [
  {
    name: "United States",
    code: "US",
    dialCode: "+1",
    flag: "🇺🇸"
  },
  {
    name: "Peru",
    code: "PE", 
    dialCode: "+51",
    flag: "🇵🇪"
  },
  {
    name: "Mexico",
    code: "MX",
    dialCode: "+52", 
    flag: "🇲🇽"
  },
  {
    name: "Colombia",
    code: "CO",
    dialCode: "+57",
    flag: "🇨🇴"
  },
  {
    name: "Argentina",
    code: "AR",
    dialCode: "+54",
    flag: "🇦🇷"
  },
  {
    name: "Chile",
    code: "CL",
    dialCode: "+56",
    flag: "🇨🇱"
  },
  {
    name: "Ecuador",
    code: "EC",
    dialCode: "+593",
    flag: "🇪🇨"
  },
  {
    name: "Bolivia",
    code: "BO",
    dialCode: "+591",
    flag: "🇧🇴"
  },
  {
    name: "Venezuela",
    code: "VE",
    dialCode: "+58",
    flag: "🇻🇪"
  },
  {
    name: "Brazil",
    code: "BR",
    dialCode: "+55",
    flag: "🇧🇷"
  },
  {
    name: "Uruguay",
    code: "UY",
    dialCode: "+598",
    flag: "🇺🇾"
  },
  {
    name: "Paraguay",
    code: "PY",
    dialCode: "+595",
    flag: "🇵🇾"
  },
  {
    name: "Spain",
    code: "ES",
    dialCode: "+34",
    flag: "🇪🇸"
  },
  {
    name: "Canada",
    code: "CA",
    dialCode: "+1",
    flag: "🇨🇦"
  },
  {
    name: "United Kingdom",
    code: "GB",
    dialCode: "+44",
    flag: "🇬🇧"
  },
  {
    name: "France",
    code: "FR",
    dialCode: "+33",
    flag: "🇫🇷"
  },
  {
    name: "Germany",
    code: "DE",
    dialCode: "+49",
    flag: "🇩🇪"
  },
  {
    name: "Italy",
    code: "IT",
    dialCode: "+39",
    flag: "🇮🇹"
  },
  {
    name: "Portugal",
    code: "PT",
    dialCode: "+351",
    flag: "🇵🇹"
  },
  {
    name: "China",
    code: "CN",
    dialCode: "+86",
    flag: "🇨🇳"
  },
  {
    name: "Japan",
    code: "JP",
    dialCode: "+81",
    flag: "🇯🇵"
  },
  {
    name: "India",
    code: "IN",
    dialCode: "+91",
    flag: "🇮🇳"
  },
  {
    name: "Australia",
    code: "AU",
    dialCode: "+61",
    flag: "🇦🇺"
  }
];

// País por defecto (Perú)
export const defaultCountry: Country = {
  name: "Peru",
  code: "PE",
  dialCode: "+51", 
  flag: "🇵🇪"
};

// Función para buscar país por código
export const getCountryByCode = (code: string): Country | undefined => {
  return countries.find(country => country.code === code);
};

// Función para buscar país por código de marcación
export const getCountryByDialCode = (dialCode: string): Country | undefined => {
  return countries.find(country => country.dialCode === dialCode);
};