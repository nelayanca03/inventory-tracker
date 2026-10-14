export interface CatalogPageItem {
  slot: number; // 0 to 8 (top-left to bottom-right)
  kodeStok: string;
  namaStok: string;
}

export interface CatalogPageDefinition {
  pageNumber: number;
  items: CatalogPageItem[];
}

export const CATALOG_PAGES: CatalogPageDefinition[] = [
  {
    pageNumber: 2,
    items: [
      { slot: 0, kodeStok: 'STO1901', namaStok: 'ACRYLIC STANDING LOLLIPOP (16 LUBANG) 18 CM X 18 CM' },
      { slot: 1, kodeStok: 'STO1781', namaStok: 'ALAS CANGKIR ESPRESSO 170 ML' },
      { slot: 2, kodeStok: 'STO1782', namaStok: 'ALAS CANGKIR ESPRESSO 60 ML' },
      { slot: 3, kodeStok: 'STO1785', namaStok: 'ALAS PIRING HOT PLATE BULAT 22 CM' },
      { slot: 4, kodeStok: 'STO0004', namaStok: 'ALAS PIRING HOT PLATE OVAL ( 27 X 17,5 CM )' },
      { slot: 5, kodeStok: 'STO0006', namaStok: 'ALAS STEAMAN 18"' },
      { slot: 6, kodeStok: 'STO0010', namaStok: 'ALAS STEAMER 12"' },
      { slot: 7, kodeStok: 'STO0011', namaStok: 'ALAS STEAMER 17"' },
      { slot: 8, kodeStok: 'STO1821', namaStok: 'ALAS TEMPAT SABUN KACA' }
    ]
  },
  {
    pageNumber: 3,
    items: [
      { slot: 0, kodeStok: 'STO0428', namaStok: 'ASBAK ROKOK KERAMIK PUTIH' },
      { slot: 1, kodeStok: 'STO0014', namaStok: 'BAKI BULAT KARET 35 CM / 14"' },
      { slot: 2, kodeStok: 'STO1749', namaStok: 'BAKI PETAK KARET ( 35 X 55,5 CM ) / 22"' },
      { slot: 3, kodeStok: 'STO1869', namaStok: 'BAKI PETAK KARET ( 46 X 36 CM ) / 18"' },
      { slot: 4, kodeStok: 'STO0018', namaStok: 'BAKI PETAK KAYU ( 35 X 55,5 CM ) / 22"' },
      { slot: 5, kodeStok: 'STO1747', namaStok: 'BAKI PLASTIK BAKERY PT0102 (30 X 44 CM)' },
      { slot: 6, kodeStok: 'STO0535', namaStok: 'BAMBU NASI TIM' },
      { slot: 7, kodeStok: 'STO1859', namaStok: 'BASKOM JARING STAINLESS 30 CM' },
      { slot: 8, kodeStok: 'STO1507', namaStok: 'BATU ASAH JSF' }
    ]
  },
  {
    pageNumber: 4,
    items: [
      { slot: 0, kodeStok: 'STO1812', namaStok: 'BILL HOLDER 100 CM' },
      { slot: 1, kodeStok: 'STO1881', namaStok: 'BILL HOLDER 60 CM' },
      { slot: 2, kodeStok: 'STO0021', namaStok: 'BILL HOLDER GETRA 120 CM' },
      { slot: 3, kodeStok: 'STO0711', namaStok: 'BILL MAP' },
      { slot: 4, kodeStok: 'STO0022', namaStok: 'BOTOL DOT CABE BESAR 17 CM' },
      { slot: 5, kodeStok: 'STO0023', namaStok: 'BOTOL DOT CABE KECIL 12 CM' },
      { slot: 6, kodeStok: 'STO0488', namaStok: 'BOTOL HAND SOAP' },
      { slot: 7, kodeStok: 'STO1814', namaStok: 'BOTOL SAUCE 24 OZ RED (SQUEEZZE)' },
      { slot: 8, kodeStok: 'STO1815', namaStok: 'BOTOL SAUCE 24 OZ YELLOW (SQUEEZZE)' }
    ]
  },
  {
    pageNumber: 5,
    items: [
      { slot: 0, kodeStok: 'STO1817', namaStok: 'BOTOL SAUCE 400 ML' },
      { slot: 1, kodeStok: 'STO1813', namaStok: 'BOTOL SAUCE 680 ML RED' },
      { slot: 2, kodeStok: 'STO1816', namaStok: 'BOTOL SAUCE 680 ML YELLOW' },
      { slot: 3, kodeStok: 'STO0024', namaStok: 'BOTOL SOYU ACRYLIC' },
      { slot: 4, kodeStok: 'STO0400', namaStok: 'BOTOL SQUEEZE 4 LUBANG' },
      { slot: 5, kodeStok: 'STO0369', namaStok: 'BOWL S/S BERLUBANG D = 22,5 CM' },
      { slot: 6, kodeStok: 'STO1523', namaStok: 'BOWL S/S D = 12"' },
      { slot: 7, kodeStok: 'STO1613', namaStok: 'BOWL S/S D = 19CM' },
      { slot: 8, kodeStok: 'STO1402', namaStok: 'BOWL S/S D = 22 CM' }
    ]
  },
  {
    pageNumber: 6,
    items: [
      { slot: 0, kodeStok: 'STO1404', namaStok: 'BOWL S/S D = 26 CM' },
      { slot: 1, kodeStok: 'STO1252', namaStok: 'BOWL S/S D = 34 CM' },
      { slot: 2, kodeStok: 'STO0998', namaStok: 'BOWL S/S D = 36 CM' },
      { slot: 3, kodeStok: 'STO1945', namaStok: 'BOWL S/S D = 38 CM' },
      { slot: 4, kodeStok: 'STO0999', namaStok: 'BOWL S/S D = 40 CM' },
      { slot: 5, kodeStok: 'STO1823', namaStok: 'BOWL S/S D 32 CM' },
      { slot: 6, kodeStok: 'STO1824', namaStok: 'BOWL S/S D 42 CM' },
      { slot: 7, kodeStok: 'STO0632', namaStok: 'BOWL SALAD BREWSUNIQ BLACK - KEMURI' },
      { slot: 8, kodeStok: 'STO0574', namaStok: 'BOWL SARINGAN S/S D = 34 CM' }
    ]
  },
  {
    pageNumber: 7,
    items: [
      { slot: 0, kodeStok: 'STO0342', namaStok: 'BOX CONTAINER 2100-M' },
      { slot: 1, kodeStok: 'STO1753', namaStok: 'BOX CONTAINER HNT 2103 HANATA' },
      { slot: 2, kodeStok: 'STO0031', namaStok: 'BOX TISSUE LIVI' },
      { slot: 3, kodeStok: 'STO0032', namaStok: 'BOX TISSUE MERK SEE-U' },
      { slot: 4, kodeStok: 'STO0034', namaStok: 'BRUSH KAIN' },
      { slot: 5, kodeStok: 'STO0035', namaStok: 'BRUSH LANTAI + GAGANG' },
      { slot: 6, kodeStok: 'STO0909', namaStok: 'CABINET PLASTIK 3 TINGKAT LIONSTAR' },
      { slot: 7, kodeStok: 'STO1592', namaStok: 'CANGKIR ESPRESSO 170 ML' },
      { slot: 8, kodeStok: 'STO0910', namaStok: 'CANGKIR ESPRESSO 60ML' }
    ]
  },
  {
    pageNumber: 8,
    items: [
      { slot: 0, kodeStok: 'STO0392', namaStok: 'CANGKIR LITERAN 1 LITER' },
      { slot: 1, kodeStok: 'STO0912', namaStok: 'CANGKIR LITERAN 250 ML' },
      { slot: 2, kodeStok: 'STO1850', namaStok: 'CANGKIR LITERAN 3 LITER' },
      { slot: 3, kodeStok: 'STO1825', namaStok: 'CANGKIR S/S 10 CM' },
      { slot: 4, kodeStok: 'STO1826', namaStok: 'CANGKIR S/S 11 CM' },
      { slot: 5, kodeStok: 'UNF0095', namaStok: 'CELEMEK TERPAL' },
      { slot: 6, kodeStok: 'STO0409', namaStok: 'CENTONG MELAMIN PUTIH 403' },
      { slot: 7, kodeStok: 'STO0038', namaStok: 'CENTONG S/S BERLUBANG (D=6.5 CM ; P=22 CM)' },
      { slot: 8, kodeStok: 'STO0039', namaStok: 'CENTONG S/S POLOS' }
    ]
  },
  {
    pageNumber: 9,
    items: [
      { slot: 0, kodeStok: 'STO1789', namaStok: 'CENTONG SOP MELAMIN KECIL' },
      { slot: 1, kodeStok: 'STO0914', namaStok: 'CONDIMENT BOX 5 LUBANG' },
      { slot: 2, kodeStok: 'STO0042', namaStok: 'CONDIMENT BOX 6 LUBANG' },
      { slot: 3, kodeStok: 'STO0503', namaStok: 'CORONG MINYAK' },
      { slot: 4, kodeStok: 'STO1788', namaStok: 'CUTLERY TRAY CT-04' },
      { slot: 5, kodeStok: 'STO0359', namaStok: 'DESSERT PLATE 6"' },
      { slot: 6, kodeStok: 'STO1302', namaStok: 'DISH OVAL BOWL 15" / 1002000216' },
      { slot: 7, kodeStok: 'STO0497', namaStok: 'EMBER PLASTIK 4 GALON' },
      { slot: 8, kodeStok: 'STO0047', namaStok: 'EMBER PLASTIK 50 LITER' }
    ]
  },
  {
    pageNumber: 10,
    items: [
      { slot: 0, kodeStok: 'STO0048', namaStok: 'EMBER PLASTIK 6 GALON' },
      { slot: 1, kodeStok: 'STO1344', namaStok: 'EMBER PLASTIK 60 LITER' },
      { slot: 2, kodeStok: 'STO1849', namaStok: 'EMBER PLASTIK 80 LITER' },
      { slot: 3, kodeStok: 'STO0049', namaStok: 'FLAME GUN GAS KALENG' },
      { slot: 4, kodeStok: 'STO0050', namaStok: 'GAGANG SAPU / BRUSH / PEL / TARIKAN AIR' },
      { slot: 5, kodeStok: 'STO1843', namaStok: 'GANTUNGAN BAJU DINDING S/S' },
      { slot: 6, kodeStok: 'STO0051', namaStok: 'GANTUNGAN BBQ S/S' },
      { slot: 7, kodeStok: 'STO0053', namaStok: 'GARPU S/S MERK DOLL BESAR' },
      { slot: 8, kodeStok: 'STO1118', namaStok: 'GARPU S/S MERK VIP' }
    ]
  },
  {
    pageNumber: 11,
    items: [
      { slot: 0, kodeStok: 'STO0056', namaStok: 'GASTRO PAN 1/1 T 10 CM' },
      { slot: 1, kodeStok: 'STO0057', namaStok: 'GASTRO PAN 1/1 T 10 CM (PERFORATED)' },
      { slot: 2, kodeStok: 'STO0061', namaStok: 'GASTRO PAN 1/6 T=10 CM' },
      { slot: 3, kodeStok: 'STO0062', namaStok: 'GASTRO PAN 1/9 T=10 CM' },
      { slot: 4, kodeStok: 'STO0066', namaStok: 'GAYUNG PLASTIK KECIL' },
      { slot: 5, kodeStok: 'STO0410', namaStok: 'GELAS BIR' },
      { slot: 6, kodeStok: 'STO1808', namaStok: 'GELAS KACA LUMINARC - ISLAND TUMBLER OF 30' },
      { slot: 7, kodeStok: 'STO1809', namaStok: 'GELAS KACA LUMINARC - VIGNE TUMBLER HB 35' },
      { slot: 8, kodeStok: 'STO1793', namaStok: 'GELAS KERAMIK PUTIH (GZ)' }
    ]
  },
  {
    pageNumber: 12,
    items: [
      { slot: 0, kodeStok: 'STO1921', namaStok: 'GELAS WINE LIBBEY BRILLIANCE 350 ML' },
      { slot: 1, kodeStok: 'STO0080', namaStok: 'GUNTING BESAR' },
      { slot: 2, kodeStok: 'STO0082', namaStok: 'HAND SPRAYER' },
      { slot: 3, kodeStok: 'STO0491', namaStok: 'HANDUK BESAR' },
      { slot: 4, kodeStok: 'STA0040', namaStok: 'HEKTER KECIL HD-10' },
      { slot: 5, kodeStok: 'STO0083', namaStok: 'HOCK MASAK 5"' },
      { slot: 6, kodeStok: 'STO0084', namaStok: 'HOCK MASAK 6"' },
      { slot: 7, kodeStok: 'STO0510', namaStok: 'JAM DINDING' },
      { slot: 8, kodeStok: 'STO0086', namaStok: 'JEPITAN BAJU PLASTIK' }
    ]
  },
  {
    pageNumber: 13,
    items: [
      { slot: 0, kodeStok: 'STO0087', namaStok: 'JEPITAN BUAYA 6"' },
      { slot: 1, kodeStok: 'STO0089', namaStok: 'JEPITAN KERANJANG DIMSUM 8,5"' },
      { slot: 2, kodeStok: 'STO0090', namaStok: 'JEPITAN KUE ACRYLIC' },
      { slot: 3, kodeStok: 'STO0093', namaStok: 'KAIN LAP KANEBO' },
      { slot: 4, kodeStok: 'STO0094', namaStok: 'KAIN PEL + GAGANG' },
      { slot: 5, kodeStok: 'STO1848', namaStok: 'KAIN SARINGAN SERUT 10 X 10 CM' },
      { slot: 6, kodeStok: 'STA0049', namaStok: 'KALKULATOR' },
      { slot: 7, kodeStok: 'STO0735', namaStok: 'KALO 427 (LT 1)' },
      { slot: 8, kodeStok: 'STO0097', namaStok: 'KALO BULAT PLASTIK 12,5" NO.370' }
    ]
  },
  {
    pageNumber: 14,
    items: [
      { slot: 0, kodeStok: 'STO1865', namaStok: 'KALO KENDURI BULAT (18 CM)' },
      { slot: 1, kodeStok: 'STO0099', namaStok: 'KALO PETAK MERK SHINPO NO.SIP 211' },
      { slot: 2, kodeStok: 'STO0100', namaStok: 'KALO PETAK NO 216 L' },
      { slot: 3, kodeStok: 'STO0102', namaStok: 'KALO PETAK NO 305' },
      { slot: 4, kodeStok: 'STO0101', namaStok: 'KALO PETAK NO 306' },
      { slot: 5, kodeStok: 'STO0103', namaStok: 'KALO PETAK SIP 821 L' },
      { slot: 6, kodeStok: 'STO1506', namaStok: 'KARET ALAS XIAO LONG PAO' },
      { slot: 7, kodeStok: 'STO0106', namaStok: 'KARPET ALAS GELAS' },
      { slot: 8, kodeStok: 'STO0391', namaStok: 'KARPET KARET BERLUBANG' }
    ]
  },
  {
    pageNumber: 15,
    items: [
      { slot: 0, kodeStok: 'STO1805', namaStok: 'KARPET KARET MERAH' },
      { slot: 1, kodeStok: 'STO0107', namaStok: 'KAYU BULAT UNTUK KULIT PUTIH' },
      { slot: 2, kodeStok: 'STO0492', namaStok: 'KEMOCENG' },
      { slot: 3, kodeStok: 'STO0111', namaStok: 'KERANJANG SIAO LONG PAO 25 CM' },
      { slot: 4, kodeStok: 'STO0114', namaStok: 'KERANJANG YAMCHA KECIL 13 CM (4 INCH)' },
      { slot: 5, kodeStok: 'STO0115', namaStok: 'KERANJANG YAMCHA SEDANG 15 CM (5 INCH)' },
      { slot: 6, kodeStok: 'STO0116', namaStok: 'KEROKAN SISIK IKAN' },
      { slot: 7, kodeStok: 'STO0118', namaStok: 'KEYTAK BAMBU' },
      { slot: 8, kodeStok: 'STO0119', namaStok: 'KOCOKAN TELUR' }
    ]
  },
  {
    pageNumber: 16,
    items: [
      { slot: 0, kodeStok: 'STO0355', namaStok: 'KOMPOR ELEKTRIK' },
      { slot: 1, kodeStok: 'STO0120', namaStok: 'KOTAK DICKY' },
      { slot: 2, kodeStok: 'STO1596', namaStok: 'KOTAK LION STAR 1 LITER' },
      { slot: 3, kodeStok: 'STO0122', namaStok: 'KOTAK LION STAR 2 LITER' },
      { slot: 4, kodeStok: 'STO1879', namaStok: 'KOTAK LION STAR B47 1,2 LITER' },
      { slot: 5, kodeStok: 'STO0123', namaStok: 'KOTAK LION STAR CLEAR BOX NO.10' },
      { slot: 6, kodeStok: 'STO0124', namaStok: 'KOTAK LION STAR CLEAR BOX NO.20' },
      { slot: 7, kodeStok: 'STO0522', namaStok: 'KOTAK LION STAR CLEAR BOX NO.30' },
      { slot: 8, kodeStok: 'STO1528', namaStok: 'KOTAK NAGATA 5545' }
    ]
  },
  {
    pageNumber: 17,
    items: [
      { slot: 0, kodeStok: 'STO0373', namaStok: 'KRAT GELAS' },
      { slot: 1, kodeStok: 'STO0376', namaStok: 'KRAT GELAS GREEN LEAF 2195 L' },
      { slot: 2, kodeStok: 'STO0127', namaStok: 'KUALI ALUMINIUM 22"' },
      { slot: 3, kodeStok: 'STO0494', namaStok: 'KUALI HITAM BESI 16"' },
      { slot: 4, kodeStok: 'STO0479', namaStok: 'KUALI HITAM BESI 18"' },
      { slot: 5, kodeStok: 'STO0135', namaStok: 'KUALI HITAM BESI 22"' },
      { slot: 6, kodeStok: 'STO0136', namaStok: 'KUALI HITAM BESI 24"' },
      { slot: 7, kodeStok: 'STO0133', namaStok: 'KUALI HITAM BESI 26"' },
      { slot: 8, kodeStok: 'STO0399', namaStok: 'KURSI PLASTIK BAKSO' }
    ]
  },
  {
    pageNumber: 18,
    items: [
      { slot: 0, kodeStok: 'STA0117', namaStok: 'LABEL TEMBAK 1 JALUR' },
      { slot: 1, kodeStok: 'STO2210', namaStok: 'LADDLE D 9 CM' },
      { slot: 2, kodeStok: 'STO1787', namaStok: 'LEMARI PLASTIK PRESA CONTAINER XL-2 2 TINGKAT' },
      { slot: 3, kodeStok: 'STO1723', namaStok: 'LIVI DISPENSER MULTIFOLD TOWEL' },
      { slot: 4, kodeStok: 'STO0922', namaStok: 'LONG BAR SPOON 30CM' },
      { slot: 5, kodeStok: 'STO1876', namaStok: 'LUCSA SAPU TAMAN' },
      { slot: 6, kodeStok: 'STO0140', namaStok: 'MAGNETIC KNIFE HOLDER MKH-46' },
      { slot: 7, kodeStok: 'STO0141', namaStok: 'MANCIS TEMBAK' },
      { slot: 8, kodeStok: 'STO0142', namaStok: 'MANGKOK 4" MERAH PLASTIK MERK ULTRA NO.353' }
    ]
  },
  {
    pageNumber: 19,
    items: [
      { slot: 0, kodeStok: 'STO1883', namaStok: 'MANGKOK BULAT KERAMIK 7"' },
      { slot: 1, kodeStok: 'STO0149', namaStok: 'MANGKOK BULAT MELAMIN 5906' },
      { slot: 2, kodeStok: 'STO1846', namaStok: 'MANGKOK CETAKAN APEM S/S' },
      { slot: 3, kodeStok: 'STO0758', namaStok: 'MANGKOK CLAYPOT 10"' },
      { slot: 4, kodeStok: 'STO1757', namaStok: 'MANGKOK CLAYPOT UK. 8,5"' },
      { slot: 5, kodeStok: 'STO1756', namaStok: 'MANGKOK CLAYPOT UK. 9,5"' },
      { slot: 6, kodeStok: 'STO0152', namaStok: 'MANGKOK CUNCAI 10 CM' },
      { slot: 7, kodeStok: 'STO1380', namaStok: 'MANGKOK CUNCAI PENDEK + TUTUP' },
      { slot: 8, kodeStok: 'STO1790', namaStok: 'MANGKOK CUNCAI PENDEK BERKUPING' }
    ]
  },
  {
    pageNumber: 20,
    items: [
      { slot: 0, kodeStok: 'STO1880', namaStok: 'MANGKOK KACA 5"' },
      { slot: 1, kodeStok: 'STO1267', namaStok: 'MANGKOK MELAMIN 7190' },
      { slot: 2, kodeStok: 'STO1925', namaStok: 'MANGKOK MELAMIN BULAT HIJAU 4,5" LIU\'S (GZ)' },
      { slot: 3, kodeStok: 'STO0154', namaStok: 'MANGKOK MELAMIN MERAH 3955' },
      { slot: 4, kodeStok: 'STO0924', namaStok: 'MANGKOK S/S 23 CM (9")' },
      { slot: 5, kodeStok: 'STO0768', namaStok: 'MANGKOK S/S 5"' },
      { slot: 6, kodeStok: 'STO0162', namaStok: 'MANGKOK SOP MELAMIN 5235' },
      { slot: 7, kodeStok: 'STO1766', namaStok: 'MANGKOK SOUP 10" (GZ)' },
      { slot: 8, kodeStok: 'STO1764', namaStok: 'MANGKOK SOUP 8" (GZ)' }
    ]
  },
  {
    pageNumber: 21,
    items: [
      { slot: 0, kodeStok: 'STO1765', namaStok: 'MANGKOK SOUP 9" (GZ)' },
      { slot: 1, kodeStok: 'STO1024', namaStok: 'MILK JUG 3 OZ' },
      { slot: 2, kodeStok: 'STO0925', namaStok: 'MILK JUG 330 ML' },
      { slot: 3, kodeStok: 'STO1525', namaStok: 'MILK JUG BOWL 600 ML' },
      { slot: 4, kodeStok: 'UNF0092', namaStok: 'NAPKIN MERAH' },
      { slot: 5, kodeStok: 'STO1804', namaStok: 'NOMOR MEJA ACRYLIC' },
      { slot: 6, kodeStok: 'STO0166', namaStok: 'NOZZLE BOTOL SIRUP' },
      { slot: 7, kodeStok: 'STO1820', namaStok: 'OIL DRAIN TRAY S/S' },
      { slot: 8, kodeStok: 'STO0774', namaStok: 'OLYMPIC STRORAGE SOLUTION(BOX CHINESE TEA)' }
    ]
  },
  {
    pageNumber: 22,
    items: [
      { slot: 0, kodeStok: 'STO1300', namaStok: 'OVAL ROUND PLATE 14" / 1001000570' },
      { slot: 1, kodeStok: 'STO0167', namaStok: 'PAN SAUCE/SAUCE POT STAINLESS STEAL D = 18 CM' },
      { slot: 2, kodeStok: 'STO1830', namaStok: 'PAN SAUCE/SAUCE POT STAINLESS STEAL D = 22 CM' },
      { slot: 3, kodeStok: 'STO1584', namaStok: 'PANCI BULAT S/S 24 X 20 CM' },
      { slot: 4, kodeStok: 'STO0171', namaStok: 'PANCI S/S D = 12"' },
      { slot: 5, kodeStok: 'STO1939', namaStok: 'PANCI S/S D = 42 CM' },
      { slot: 6, kodeStok: 'STO1141', namaStok: 'PANCI S/S D=23 CM T=18 CM' },
      { slot: 7, kodeStok: 'STO1063', namaStok: 'PANCI S/S D=28 CM T=23 CM' },
      { slot: 8, kodeStok: 'STO1064', namaStok: 'PANCI S/S D=29 CM T=24 CM' }
    ]
  },
  {
    pageNumber: 23,
    items: [
      { slot: 0, kodeStok: 'STO1142', namaStok: 'PANCI S/S D=32 CM T=35 CM' },
      { slot: 1, kodeStok: 'STO1140', namaStok: 'PANCI S/S D=33 CM T=25 CM' },
      { slot: 2, kodeStok: 'STO1655', namaStok: 'PANCI S/S D=35 CM T=34,5 CM' },
      { slot: 3, kodeStok: 'STO0478', namaStok: 'PANCI S/S D=40 CM, T=35 CM' },
      { slot: 4, kodeStok: 'STO1066', namaStok: 'PANCI S/S D=45 CM T=40 CM' },
      { slot: 5, kodeStok: 'STO1801', namaStok: 'PAPAN OPEN / CLOSE' },
      { slot: 6, kodeStok: 'STO1800', namaStok: 'PAPAN RESERVED' },
      { slot: 7, kodeStok: 'STO0593', namaStok: 'PARANG BEBEK' },
      { slot: 8, kodeStok: 'STO0174', namaStok: 'PARANG BESAR GAGANG KAYU' }
    ]
  },
  {
    pageNumber: 24,
    items: [
      { slot: 0, kodeStok: 'STO0362', namaStok: 'PARANG BESAR GAGANG S/S' },
      { slot: 1, kodeStok: 'STO1346', namaStok: 'PARUTAN 4 SISI' },
      { slot: 2, kodeStok: 'STO1345', namaStok: 'PARUTAN KEJU S/S' },
      { slot: 3, kodeStok: 'STO0176', namaStok: 'PAYUNG BESAR' },
      { slot: 4, kodeStok: 'STO0357', namaStok: 'PEALER ORANGE' },
      { slot: 5, kodeStok: 'STO0177', namaStok: 'PEMBUKA KALENG STAINLESS STEEL' },
      { slot: 6, kodeStok: 'STO0178', namaStok: 'PEMBUKA TUTUP BOTOL' },
      { slot: 7, kodeStok: 'STO0179', namaStok: 'PEMBUKA TUTUP WINE' },
      { slot: 8, kodeStok: 'STO0181', namaStok: 'PEMUKUL BAWANG / DAGING' }
    ]
  },
  {
    pageNumber: 25,
    items: [
      { slot: 0, kodeStok: 'STO0182', namaStok: 'PENGOREK BUAH' },
      { slot: 1, kodeStok: 'STO1891', namaStok: 'PINSET' },
      { slot: 2, kodeStok: 'STO1792', namaStok: 'PIRING 3 LUBANG LOGO LIU\'S GARDEN (GZ)' },
      { slot: 3, kodeStok: 'STO1927', namaStok: 'PIRING BIRU PUTIH 35,5 CM LIU\'S (GZ)' },
      { slot: 4, kodeStok: 'STO0184', namaStok: 'PIRING BULAT KERAMIK 10"' },
      { slot: 5, kodeStok: 'STO1872', namaStok: 'PIRING BULAT KERAMIK BERKUPING 14"' },
      { slot: 6, kodeStok: 'STO0191', namaStok: 'PIRING BULAT MELAMIN 4160' },
      { slot: 7, kodeStok: 'STO0194', namaStok: 'PIRING BULAT S/S' },
      { slot: 8, kodeStok: 'STO1928', namaStok: 'PIRING CABE 2 SISI MELAMIN PUTIH NO.34 (GZ)' }
    ]
  },
  {
    pageNumber: 26,
    items: [
      { slot: 0, kodeStok: 'STO0202', namaStok: 'PIRING HOT PLATE OVAL ( 27 X 17,5 CM )' },
      { slot: 1, kodeStok: 'STO0205', namaStok: 'PIRING KAKI AYAM KERAMIK 4"' },
      { slot: 2, kodeStok: 'STO1658', namaStok: 'PIRING KERAMIK BULAT 41X41CM' },
      { slot: 3, kodeStok: 'STO0207', namaStok: 'PIRING KERAMIK MODEL SAMPAN' },
      { slot: 4, kodeStok: 'STO0430', namaStok: 'PIRING KERAMIK MOTIF LOVE' },
      { slot: 5, kodeStok: 'STO0210', namaStok: 'PIRING MELAMIN 3 LUBANG NO. 343' },
      { slot: 6, kodeStok: 'STO1924', namaStok: 'PIRING MELAMIN ABU - ABU 6616 LIU\'S (GZ)' },
      { slot: 7, kodeStok: 'STO1923', namaStok: 'PIRING MELAMIN BIRU 11,6" LIU\'S (GZ)' },
      { slot: 8, kodeStok: 'STO0987', namaStok: 'PIRING MELAMIN ORIENTAL 4160' }
    ]
  },
  {
    pageNumber: 27,
    items: [
      { slot: 0, kodeStok: 'STO1663', namaStok: 'PIRING MELAMINE BULAT 8" - 1108' },
      { slot: 1, kodeStok: 'STO0564', namaStok: 'PIRING MELAMINE HITAM LOGO NELAYAN 3111' },
      { slot: 2, kodeStok: 'STO0219', namaStok: 'PIRING OVAL KERAMIK 16"' },
      { slot: 3, kodeStok: 'STO1150', namaStok: 'PIRING OVAL MELAMIN 1512' },
      { slot: 4, kodeStok: 'STO0230', namaStok: 'PIRING PETAK MELAMIN HITAM 3217' },
      { slot: 5, kodeStok: 'STO1794', namaStok: 'PIRING SAYUR BASAH 10.2" (GZ)' },
      { slot: 6, kodeStok: 'STO1759', namaStok: 'PIRING SAYUR MOTIF LOGO LIU\'S GARDEN 11"' },
      { slot: 7, kodeStok: 'STO1760', namaStok: 'PIRING SAYUR MOTIF LOGO LIU\'S GARDEN 12"' },
      { slot: 8, kodeStok: 'STO1758', namaStok: 'PIRING SAYUR MOTIF LOGO LIU\'S GARDEN 9"' }
    ]
  },
  {
    pageNumber: 28,
    items: [
      { slot: 0, kodeStok: 'STO1762', namaStok: 'PIRING SAYUR PUTIH LOGO LIU\'S GARDEN 10.4"' },
      { slot: 1, kodeStok: 'STO1761', namaStok: 'PIRING SAYUR PUTIH LOGO LIU\'S GARDEN 8.3"' },
      { slot: 2, kodeStok: 'STO0237', namaStok: 'PIRING SUKI LOGO NELAYAN 15 X 15 CM' },
      { slot: 3, kodeStok: 'STO1769', namaStok: 'PIRING TAMU KERAMIK LOGO LIU\'S GARDEN (GZ)' },
      { slot: 4, kodeStok: 'STO1763', namaStok: 'PIRING UNTUK BEBEK PEKING' },
      { slot: 5, kodeStok: 'STO0226', namaStok: 'PIRING OVAL S/S 18"' },
      { slot: 6, kodeStok: 'STO0240', namaStok: 'PISAU BESAR 9"' },
      { slot: 7, kodeStok: 'STO1527', namaStok: 'PISAU GERGAJI' },
      { slot: 8, kodeStok: 'STO0959', namaStok: 'PISAU HAKAU' }
    ]
  },
  {
    pageNumber: 29,
    items: [
      { slot: 0, kodeStok: 'STO0241', namaStok: 'PISAU KECIL' },
      { slot: 1, kodeStok: 'STO0242', namaStok: 'PISAU ROTI PANJANG 30 CM' },
      { slot: 2, kodeStok: 'STO1676', namaStok: 'PLATE SANGO FORIO BLUE 10" - KADEN' },
      { slot: 3, kodeStok: 'STO1844', namaStok: 'POMPA MINYAK ORIENTAL' },
      { slot: 4, kodeStok: 'STO0931', namaStok: 'POWDER SPOON' },
      { slot: 5, kodeStok: 'STO1888', namaStok: 'PRESTO ALUMUNIUM 8L' },
      { slot: 6, kodeStok: 'STO0473', namaStok: 'PRICE TAG HOLDER' },
      { slot: 7, kodeStok: 'STO0932', namaStok: 'PUMP SYRUP' },
      { slot: 8, kodeStok: 'STO1842', namaStok: 'RAKET NYAMUK' }
    ]
  },
  {
    pageNumber: 30,
    items: [
      { slot: 0, kodeStok: 'STO0246', namaStok: 'RING BELL' },
      { slot: 1, kodeStok: 'STO0247', namaStok: 'SABUT CUCI PIRING KAIN' },
      { slot: 2, kodeStok: 'STO0248', namaStok: 'SAPU KUALI' },
      { slot: 3, kodeStok: 'STO0249', namaStok: 'SAPU LANTAI + GAGANG' },
      { slot: 4, kodeStok: 'STO0249A', namaStok: 'SAPU LANTAI KRISBOW' },
      { slot: 5, kodeStok: 'STO0576', namaStok: 'SARINGAN KAWAT D = 10"' },
      { slot: 6, kodeStok: 'STO0251', namaStok: 'SARINGAN KAWAT D = 12"' },
      { slot: 7, kodeStok: 'STO0252', namaStok: 'SARINGAN KAWAT D = 16"' },
      { slot: 8, kodeStok: 'STO1598', namaStok: 'SARINGAN MINYAK DUDUK S/S 30 CM' }
    ]
  },
  {
    pageNumber: 31,
    items: [
      { slot: 0, kodeStok: 'STO0380', namaStok: 'SARINGAN MINYAK GAGANG PLASTIK 20 CM' },
      { slot: 1, kodeStok: 'STO1514', namaStok: 'SARINGAN MINYAK GAGANG S/S 16 CM' },
      { slot: 2, kodeStok: 'STO0255', namaStok: 'SARINGAN MINYAK GAGANG S/S D= 20 CM' },
      { slot: 3, kodeStok: 'STO0558', namaStok: 'SARINGAN S/S D = 16 CM' },
      { slot: 4, kodeStok: 'STO0505', namaStok: 'SARINGAN S/S D = 30 CM' },
      { slot: 5, kodeStok: 'STO0322', namaStok: 'SARINGAN TEH KAIN' },
      { slot: 6, kodeStok: 'STO0258', namaStok: 'SARUNG TANGAN PANGGANGAN ( ANTI PANAS )' },
      { slot: 7, kodeStok: 'STO0941', namaStok: 'SCOOP ICE CREAM' },
      { slot: 8, kodeStok: 'STO1074', namaStok: 'SARINGAN MINYAK BERLUBANG S/S D=12"' }
    ]
  },
  {
    pageNumber: 32,
    items: [
      { slot: 0, kodeStok: 'STO1599', namaStok: 'SEKRAP BESI 2"' },
      { slot: 1, kodeStok: 'STO0261', namaStok: 'SEKRAP PLASTIK PETAK' },
      { slot: 2, kodeStok: 'STO0263', namaStok: 'SENDOK BEBEK MELAMIN PUTIH' },
      { slot: 3, kodeStok: 'STO1926', namaStok: 'SENDOK BEBEK MELAMIN PUTIH HIJAU LIU\'S (GZ)' },
      { slot: 4, kodeStok: 'STO0265', namaStok: 'SENDOK KOPI 12 CM KODE 306' },
      { slot: 5, kodeStok: 'STO0530', namaStok: 'SENDOK ES S/S' },
      { slot: 6, kodeStok: 'STO1163', namaStok: 'SENDOK MAKAN S/S "VIP"' },
      { slot: 7, kodeStok: 'STO0266', namaStok: 'SENDOK MELAMIN KECIL' },
      { slot: 8, kodeStok: 'STO1332', namaStok: 'SENDOK NASI KAYU 30 CM' }
    ]
  },
  {
    pageNumber: 33,
    items: [
      { slot: 0, kodeStok: 'STO0267', namaStok: 'SENDOK NASI PLASTIK' },
      { slot: 1, kodeStok: 'STO0824', namaStok: 'SENDOK PIZZA' },
      { slot: 2, kodeStok: 'STO0269', namaStok: 'SENDOK S/S MERK DOLL BESAR' },
      { slot: 3, kodeStok: 'STO1358', namaStok: 'SENDOK TEH PANJANG' },
      { slot: 4, kodeStok: 'STO1868', namaStok: 'SEROKAN IKAN PANJANG 40 CM' },
      { slot: 5, kodeStok: 'STO0270', namaStok: 'SEROKAN SAMPAH' },
      { slot: 6, kodeStok: 'STO1237', namaStok: 'SERVING SPOON 8" 2001000121' },
      { slot: 7, kodeStok: 'STO0942', namaStok: 'SHAKER AKRILIK' },
      { slot: 8, kodeStok: 'STO1833', namaStok: 'SIGN TOILET PRIA' }
    ]
  },
  {
    pageNumber: 34,
    items: [
      { slot: 0, kodeStok: 'STO1834', namaStok: 'SIGN TOILET WANITA' },
      { slot: 1, kodeStok: 'STO0272', namaStok: 'SODET KARET' },
      { slot: 2, kodeStok: 'STO1835', namaStok: 'SPATULA KRISBOW' },
      { slot: 3, kodeStok: 'STO0275', namaStok: 'SPONS BUSA 2 SISI' },
      { slot: 4, kodeStok: 'STO1818', namaStok: 'STAND HOLDER' },
      { slot: 5, kodeStok: 'STO1795', namaStok: 'STAND PLATE S/S CHOPPING BOARD' },
      { slot: 6, kodeStok: 'STO1797', namaStok: 'STOCKPOT 12 LTR + TUTUP' },
      { slot: 7, kodeStok: 'STO1312', namaStok: 'STRIPPED SOUP BOWL SQUARE 12" / 1002000016' },
      { slot: 8, kodeStok: 'STO0280', namaStok: 'SUMPIT MELAMIN HITAM' }
    ]
  },
  {
    pageNumber: 35,
    items: [
      { slot: 0, kodeStok: 'STO0281', namaStok: 'SUMPIT PANJANG KAYU 50CM' },
      { slot: 1, kodeStok: 'STO0282', namaStok: 'SUTIL KAYU (SPATULA KAYU)' },
      { slot: 2, kodeStok: 'STO1819', namaStok: 'SUTIL MASAK 4,5"' },
      { slot: 3, kodeStok: 'STO0283', namaStok: 'SUTIL MASAK 5"' },
      { slot: 4, kodeStok: 'STO0948', namaStok: 'TALAM PETAK ALUMINIUM 43X31CM' },
      { slot: 5, kodeStok: 'STO0836', namaStok: 'TALAM PETAK S/S 27X21 CM' },
      { slot: 6, kodeStok: 'STO0949', namaStok: 'TALAM PETAK S/S 20X27 CM' },
      { slot: 7, kodeStok: 'STO1802', namaStok: 'TALAM PETAK S/S 22X32 CM' },
      { slot: 8, kodeStok: 'STO0846', namaStok: 'TALAM PETAK S/S 60X40' }
    ]
  },
  {
    pageNumber: 36,
    items: [
      { slot: 0, kodeStok: 'STO1290', namaStok: 'TALAM STEAM 18"' },
      { slot: 1, kodeStok: 'STO1320', namaStok: 'TALI TEKO CHINESE TEA WARNA MERAH' },
      { slot: 2, kodeStok: 'STA0090', namaStok: 'TAPE DISPENSER DUDUK' },
      { slot: 3, kodeStok: 'STA0091', namaStok: 'TAPE DISPENSER PACKING' },
      { slot: 4, kodeStok: 'STO0286', namaStok: 'TARIKAN AIR + GAGANG' },
      { slot: 5, kodeStok: 'STO0287', namaStok: 'TARIKAN KACA' },
      { slot: 6, kodeStok: 'STO0288', namaStok: 'TEFLON 12" / 30 CM' },
      { slot: 7, kodeStok: 'STO0289', namaStok: 'TEKO CHINESE TEA' },
      { slot: 8, kodeStok: 'STO0291', namaStok: 'TEKO PLASTIK 2 LITER' }
    ]
  },
  {
    pageNumber: 37,
    items: [
      { slot: 0, kodeStok: 'STO0951', namaStok: 'TEKO PLASTIK PANJANG 2,2 L BENING/ACRYLIC' },
      { slot: 1, kodeStok: 'STO0590', namaStok: 'TEKO S/S 1 L' },
      { slot: 2, kodeStok: 'STO1875', namaStok: 'TEKO S/S 1.5 L / 48 OZ' },
      { slot: 3, kodeStok: 'STO0293', namaStok: 'TEKO S/S 2 L' },
      { slot: 4, kodeStok: 'STO0952', namaStok: 'TEKO S/S PENDEK' },
      { slot: 5, kodeStok: 'STO1857', namaStok: 'TELENAN BOARD HDPE BULAT' },
      { slot: 6, kodeStok: 'STO0295', namaStok: 'TELENAN KAYU 18"' },
      { slot: 7, kodeStok: 'STO1694', namaStok: 'TELENAN PLASTIK 40 X 30 (HIJAU)' },
      { slot: 8, kodeStok: 'STO1695', namaStok: 'TELENAN PLASTIK 40 X 30 (MERAH)' }
    ]
  },
  {
    pageNumber: 38,
    items: [
      { slot: 0, kodeStok: 'STO1693', namaStok: 'TELENAN PLASTIK 40 X 30 (PUTIH)' },
      { slot: 1, kodeStok: 'STO0298', namaStok: 'TEMPAT CABE KERAMIK + TUTUP' },
      { slot: 2, kodeStok: 'STO0299', namaStok: 'TEMPAT GULA CAIR' },
      { slot: 3, kodeStok: 'STO1082', namaStok: 'TEMPAT MERICA S/S BESAR' },
      { slot: 4, kodeStok: 'STO0867', namaStok: 'TEMPAT MERICA S/S KECIL' },
      { slot: 5, kodeStok: 'STO0523', namaStok: 'TEMPAT PIPET S/S' },
      { slot: 6, kodeStok: 'STO0303', namaStok: 'TERMOS NASI' },
      { slot: 7, kodeStok: 'STO0305', namaStok: 'TIMBANGAN 15 KG' },
      { slot: 8, kodeStok: 'STO0306', namaStok: 'TIMBANGAN 2 KG' }
    ]
  },
  {
    pageNumber: 39,
    items: [
      { slot: 0, kodeStok: 'STO0561', namaStok: 'TIMBANGAN 20 KG' },
      { slot: 1, kodeStok: 'STO0401', namaStok: 'TIMBANGAN DIGITAL MERK CAMRY' },
      { slot: 2, kodeStok: 'STO0431', namaStok: 'TIMER DIGITAL MERK RENO' },
      { slot: 3, kodeStok: 'STO0343', namaStok: 'TONG SAMPAH 120 LITER' },
      { slot: 4, kodeStok: 'STO1811', namaStok: 'TONG SAMPAH KRISBOW 1100 L' },
      { slot: 5, kodeStok: 'STO1837', namaStok: 'TONG SAMPAH KRISBOW S/S 12L' },
      { slot: 6, kodeStok: 'STO1838', namaStok: 'TONG SAMPAH KRISBOW S/S 5L' },
      { slot: 7, kodeStok: 'STO0968', namaStok: 'TONG SAMPAH SHINPO PIJAK 20L' },
      { slot: 8, kodeStok: 'STO1806', namaStok: 'TONG SAMPAH TROLLEY (UK. BESAR)' }
    ]
  },
  {
    pageNumber: 40,
    items: [
      { slot: 0, kodeStok: 'STO1807', namaStok: 'TONG SAMPAH TROLLEY (UK. KECIL)' },
      { slot: 1, kodeStok: 'STO0307', namaStok: 'TOPLES BULAT 1 LITER' },
      { slot: 2, kodeStok: 'STO1582', namaStok: 'TOPLES BULAT 1 LITER SIP 352 L' },
      { slot: 3, kodeStok: 'STO0309', namaStok: 'TOPLES BULAT 16 LTR' },
      { slot: 4, kodeStok: 'STO0310', namaStok: 'TOPLES BULAT 5 LTR' },
      { slot: 5, kodeStok: 'STO0456', namaStok: 'TOPLES PETAK NAGATA 995' },
      { slot: 6, kodeStok: 'STO1861', namaStok: 'TOPLES PLASTIK 1,7 LITER' },
      { slot: 7, kodeStok: 'STO0311', namaStok: 'TOPLES S/S 1 LITER' },
      { slot: 8, kodeStok: 'STO0323', namaStok: 'TOWEL WARNA - WARNI PANJANG' }
    ]
  },
  {
    pageNumber: 41,
    items: [
      { slot: 0, kodeStok: 'STO1909', namaStok: 'TRAY MINI CAKE UKURAN M (30,8 X 22,2 X 1,5 CM)' },
      { slot: 1, kodeStok: 'STO1908', namaStok: 'TRAY MINI CAKE UKURAN S (24 X 17 X 1,5 CM)' },
      { slot: 2, kodeStok: 'STO1737', namaStok: 'TURNING SLICER' },
      { slot: 3, kodeStok: 'STA0097', namaStok: 'TUSUKAN BON' },
      { slot: 4, kodeStok: 'STO1853', namaStok: 'TUTUP JERIGEN SET LUAR DAN DALAM' },
      { slot: 5, kodeStok: 'STO0317', namaStok: 'TUTUP KERANJANG SIAO LONG PAO 25 CM' },
      { slot: 6, kodeStok: 'STO0319', namaStok: 'TUTUP KERANJANG YAMCHA KECIL 13 CM' },
      { slot: 7, kodeStok: 'STO0320', namaStok: 'TUTUP KERANJANG YAMCHA SEDANG 15 CM' },
      { slot: 8, kodeStok: 'STO0888', namaStok: 'TUTUP KUALI ALUMINIUM 14"' }
    ]
  },
  {
    pageNumber: 42,
    items: [
      { slot: 0, kodeStok: 'STO0414', namaStok: 'TUTUP MAKANAN BULAT' },
      { slot: 1, kodeStok: 'STO0415', namaStok: 'TUTUP MAKANAN PETAK 42 CM X 33 CM' },
      { slot: 2, kodeStok: 'STO1689', namaStok: 'VEGETABLE PEELER' },
      { slot: 3, kodeStok: 'STO1889', namaStok: 'WINE BUCKET 5L' },
      { slot: 4, kodeStok: 'STO0321', namaStok: 'ZIGER S/S' },
      { slot: 5, kodeStok: 'STO2211', namaStok: 'TEMPAT TUSUK GIGI ACRYLIC' }
    ]
  }
];

export function findCatalogPageByKode(kodeStok: string): { pageNumber: number; slot: number } | null {
  const norm = kodeStok.trim().toUpperCase();
  for (const p of CATALOG_PAGES) {
    const item = p.items.find(i => i.kodeStok.toUpperCase() === norm);
    if (item) return { pageNumber: p.pageNumber, slot: item.slot };
  }
  return null;
}
