// Country-to-product mapping based on products.json
// Each product ID maps to the actual product in products.json

export type CountryData = {
  name: string;
  nameDE: string;
  productIds: number[];
  flag: string;
};

export const countryProducts: Record<string, CountryData> = {
  DE: {
    name: "Germany",
    nameDE: "Deutschland",
    flag: "\u{1F1E9}\u{1F1EA}",
    productIds: [
      1, // Flensburger
      2, // Bitburger Pils
      3, // Schlösser Alt
      4, // Paulaner Spezi
      5, // König Pilsener
      6, // Radeberger Pilsner
      9, // Duckstein Original
      11, // Franziskaner Weissbier
      13, // Frankenheim Alt
      14, // Kloster Andechs
      15, // Brinkhoff's No. 1
      16, // Hövels Original
      17, // Karlsberg Mixery
      19, // Störtebeker
      20, // Traugott Simon Naturradler
      22, // Erdinger Weißbier
      23, // Leikeim Premium Pils
      24, // Borbecker Dampfe
      25, // Maisel & Friends Fusion IPA
      26, // Maisel & Friends Biergenuss
      52, // Maybach Wein
      53, // Edition Exclusiv Spätburgunder
      55, // Ahr Weine
      56, // Lucashof Pfalz
      62, // Markus Molitor Mosel
      63, // Kloster Eberbach Riesling
      72, // Bree Weine
      79, // Heinrich Gies Pfalz
      80, // Vier Jahreszeiten Pfalz
      81, // Fürst von Metternich Sekt
      82, // Jules Mumm Sekt
      83, // Geldermann Sekt
      96, // Asbach Uralt
      97, // Kabänes Kräuter
      106, // Slyrs Classic Whisky
      120, // Wood Stork Spiced Rum
      126, // Heimatkraut
      127, // Pfiffikuss
      128, // Haselmaus
      130, // Knut Hansen Dry Gin
      132, // Röst Aroma
      133, // Sommeraffäre
      134, // Koko Loko
      135, // Klares Gold
      136, // Wellings Premium
      138, // Seitensprung
      139, // Wellings Butterscotch
      140, // Wellings Wein
    ],
  },
  IE: {
    name: "Ireland",
    nameDE: "Irland",
    flag: "\u{1F1EE}\u{1F1EA}",
    productIds: [
      12, // Guinness Draught 0.0%
      18, // Guinness Draught
      99, // Connemara
    ],
  },
  GB: {
    name: "Scotland",
    nameDE: "Schottland",
    flag: "\u{1F3F4}\u{E0067}\u{E0062}\u{E0073}\u{E0063}\u{E0074}\u{E007F}",
    productIds: [
      91, // Glenmorangie
      117, // Glenfiddich
      122, // Aberfeldy
      123, // Laphroaig
      124, // The Balvenie Double Wood
      125, // Monkey Shoulder
      131, // Hendrick's Gin
    ],
  },
  US: {
    name: "USA",
    nameDE: "USA",
    flag: "\u{1F1FA}\u{1F1F8}",
    productIds: [
      89, // Jack Daniel's
      102, // Jim Beam Black
      104, // Maker's Mark
      105, // Jack Daniel's Single Barrel
    ],
  },
  JP: {
    name: "Japan",
    nameDE: "Japan",
    flag: "\u{1F1EF}\u{1F1F5}",
    productIds: [
      90, // Suntory Toki
    ],
  },
  ES: {
    name: "Spain",
    nameDE: "Spanien",
    flag: "\u{1F1EA}\u{1F1F8}",
    productIds: [
      10, // Estrella Damm
      54, // El Caserón
      58, // Campo Arriba
      59, // Rioja Vega Gran Reserva
      68, // Rioja Vega Crianza
      108, // Gin Mare
      121, // Carlos I Brandy
    ],
  },
  IT: {
    name: "Italy",
    nameDE: "Italien",
    flag: "\u{1F1EE}\u{1F1F9}",
    productIds: [
      37, // San Pellegrino
      50, // Intrigo
      51, // Doppio Passo
      60, // Antico Monastero
      61, // Südtiroler Lagrein
      65, // Scarànto Lugana
      66, // Regaleali
      67, // Empirio Primitivo di Manduria
      73, // Scavi & Ray Moscato
      74, // Scavi & Ray Lugana
      75, // Scavi & Ray Prosecco
      76, // Barbanera Vecciano
      77, // Scavi & Ray Ice Prestige
      78, // Scavi & Ray Primitivo
      84, // Valdo Prosecco
      88, // Aperol
      93, // Ramazzotti
      103, // Nonino Grappa
    ],
  },
  FR: {
    name: "France",
    nameDE: "Frankreich",
    flag: "\u{1F1EB}\u{1F1F7}",
    productIds: [
      57, // Paul Crochot Petit Chablis
      69, // Château Saint-Lô Grand Cru
      70, // Grand Corbier Crémant de Bordeaux
      85, // Grand Plaisir Champagner
      86, // Moët & Chandon
      98, // Cointreau
      115, // Grey Goose Vodka
      118, // Hennessy Cognac
      119, // Rémy Martin VSOP
    ],
  },
  NL: {
    name: "Netherlands",
    nameDE: "Niederlande",
    flag: "\u{1F1F3}\u{1F1F1}",
    productIds: [
      7, // Heineken
    ],
  },
  DK: {
    name: "Denmark",
    nameDE: "Dänemark",
    flag: "\u{1F1E9}\u{1F1F0}",
    productIds: [
      8, // Carlsberg
    ],
  },
  CU: {
    name: "Cuba",
    nameDE: "Kuba",
    flag: "\u{1F1E8}\u{1F1FA}",
    productIds: [
      109, // Havana Club
    ],
  },
  VE: {
    name: "Venezuela",
    nameDE: "Venezuela",
    flag: "\u{1F1FB}\u{1F1EA}",
    productIds: [
      113, // Botucal
    ],
  },
  PH: {
    name: "Philippines",
    nameDE: "Philippinen",
    flag: "\u{1F1F5}\u{1F1ED}",
    productIds: [
      114, // Don Papa
    ],
  },
  BB: {
    name: "Barbados",
    nameDE: "Barbados",
    flag: "\u{1F1E7}\u{1F1E7}",
    productIds: [
      110, // Bumbu
    ],
  },
  AT: {
    name: "Austria",
    nameDE: "\u00d6sterreich",
    flag: "\u{1F1E6}\u{1F1F9}",
    productIds: [
      64, // Pfaffl
      111, // Raunikar
      129, // Dolomiti
      137, // Prinz
    ],
  },
  GR: {
    name: "Greece",
    nameDE: "Griechenland",
    flag: "\u{1F1EC}\u{1F1F7}",
    productIds: [
      107, // Metaxa
    ],
  },
};
