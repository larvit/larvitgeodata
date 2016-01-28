SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `geo_languages` (
  `code` varchar(20) CHARACTER SET ascii NOT NULL,
  PRIMARY KEY (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `geo_languageNames` (
  `languageCode` varchar(20) CHARACTER SET ascii NOT NULL,
  `dispLanguageCode` varchar(20) CHARACTER SET ascii NOT NULL,
  `dispName` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`languageCode`,`dispLanguageCode`),
  KEY `dispLanguageCode` (`dispLanguageCode`),
  CONSTRAINT `geo_languageNames_ibfk_1` FOREIGN KEY (`languageCode`) REFERENCES `geo_languages` (`code`),
  CONSTRAINT `geo_languageNames_ibfk_2` FOREIGN KEY (`dispLanguageCode`) REFERENCES `geo_languages` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `geo_regions` (
  `id` smallint(5) unsigned NOT NULL,
  `name` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci COMMENT='Reference: http://cldr.unicode.org/index/downloads';

CREATE TABLE IF NOT EXISTS `geo_regions_region` (
  `id` smallint(5) unsigned NOT NULL,
  `contains` smallint(5) unsigned NOT NULL,
  PRIMARY KEY (`id`,`contains`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci COMMENT='Reference: http://cldr.unicode.org/index/downloads';

CREATE TABLE IF NOT EXISTS `geo_regions_territory` (
  `id` smallint(5) unsigned NOT NULL,
  `contains` smallint(5) unsigned NOT NULL,
  PRIMARY KEY (`id`,`contains`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Reference: http://cldr.unicode.org/index/downloads';

CREATE TABLE IF NOT EXISTS `geo_territories` (
  `id` smallint(5) unsigned NOT NULL,
  `iso3` char(3) COLLATE utf8_unicode_ci NOT NULL,
  `iso2` char(2) COLLATE utf8_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `iso3` (`iso3`),
  UNIQUE KEY `iso2` (`iso2`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci COMMENT='Reference: http://en.wikipedia.org/wiki/ISO_3166';

INSERT IGNORE INTO `geo_regions` (`id`, `name`) VALUES(1, 'World'),(2, 'Africa'),(3, 'North America'),(5, 'South America'),(9, 'Oceania'),(11, 'Western Africa'),(13, 'Central America'),(14, 'Eastern Africa'),(15, 'Northern Africa'),(17, 'Middle Africa'),(18, 'Southern Africa'),(19, 'Americas'),(21, 'Northern America'),(29, 'Caribbean'),(30, 'Eastern Asia'),(34, 'Southern Asia'),(35, 'Southeast Asia'),(39, 'Southern Europe'),(53, 'Australasia'),(54, 'Melanesia'),(57, 'Micronesian Region'),(61, 'Polynesia'),(142, 'Asia'),(143, 'Central Asia'),(145, 'Western Asia'),(150, 'Europe'),(151, 'Eastern Europe'),(154, 'Northern Europe'),(155, 'Western Europe'),(419, 'Latin America');
INSERT IGNORE INTO `geo_regions_region` (`id`, `contains`) VALUES(1, 2),(1, 9),(1, 19),(1, 142),(1, 150),(2, 11),(2, 14),(2, 15),(2, 17),(2, 18),(3, 13),(3, 21),(3, 29),(9, 53),(9, 54),(9, 57),(9, 61),(19, 5),(19, 13),(19, 21),(19, 29),(142, 30),(142, 34),(142, 35),(142, 143),(142, 145),(150, 39),(150, 151),(150, 154),(150, 155),(419, 5),(419, 13),(419, 29);
INSERT IGNORE INTO `geo_regions_territory` (`id`, `contains`) VALUES(1, 10),(2, 260),(3, 581),(5, 32),(5, 68),(5, 76),(5, 152),(5, 170),(5, 218),(5, 238),(5, 239),(5, 254),(5, 328),(5, 600),(5, 604),(5, 740),(5, 858),(5, 862),(9, 162),(9, 166),(9, 334),(11, 132),(11, 204),(11, 270),(11, 288),(11, 324),(11, 384),(11, 430),(11, 466),(11, 478),(11, 562),(11, 566),(11, 624),(11, 654),(11, 686),(11, 694),(11, 768),(11, 854),(13, 84),(13, 188),(13, 222),(13, 320),(13, 340),(13, 484),(13, 558),(13, 591),(14, 108),(14, 174),(14, 175),(14, 231),(14, 232),(14, 262),(14, 404),(14, 450),(14, 454),(14, 480),(14, 508),(14, 638),(14, 646),(14, 690),(14, 706),(14, 716),(14, 800),(14, 834),(14, 894),(15, 12),(15, 434),(15, 504),(15, 728),(15, 729),(15, 732),(15, 788),(15, 818),(15, 10003),(15, 10008),(17, 24),(17, 120),(17, 140),(17, 148),(17, 178),(17, 180),(17, 226),(17, 266),(17, 678),(18, 72),(18, 426),(18, 516),(18, 710),(18, 748),(21, 60),(21, 124),(21, 304),(21, 666),(21, 840),(29, 28),(29, 44),(29, 52),(29, 92),(29, 136),(29, 192),(29, 212),(29, 214),(29, 308),(29, 312),(29, 332),(29, 388),(29, 474),(29, 500),(29, 531),(29, 533),(29, 534),(29, 535),(29, 630),(29, 652),(29, 659),(29, 660),(29, 662),(29, 663),(29, 670),(29, 780),(29, 796),(29, 850),(30, 156),(30, 158),(30, 344),(30, 392),(30, 408),(30, 410),(30, 446),(30, 496),(34, 4),(34, 50),(34, 64),(34, 144),(34, 356),(34, 364),(34, 462),(34, 524),(34, 586),(35, 96),(35, 104),(35, 116),(35, 360),(35, 418),(35, 458),(35, 608),(35, 626),(35, 702),(35, 704),(35, 764),(39, 8),(39, 20),(39, 70),(39, 191),(39, 292),(39, 300),(39, 336),(39, 380),(39, 470),(39, 499),(39, 620),(39, 674),(39, 688),(39, 705),(39, 724),(39, 807),(53, 36),(53, 554),(53, 574),(54, 90),(54, 242),(54, 540),(54, 548),(54, 598),(57, 296),(57, 316),(57, 520),(57, 580),(57, 583),(57, 584),(57, 585),(61, 16),(61, 184),(61, 258),(61, 570),(61, 612),(61, 772),(61, 776),(61, 798),(61, 876),(61, 882),(143, 398),(143, 417),(143, 762),(143, 795),(143, 860),(145, 31),(145, 48),(145, 51),(145, 196),(145, 268),(145, 275),(145, 368),(145, 376),(145, 400),(145, 414),(145, 422),(145, 512),(145, 634),(145, 682),(145, 760),(145, 784),(145, 792),(145, 887),(150, 10000),(151, 100),(151, 112),(151, 203),(151, 348),(151, 498),(151, 616),(151, 642),(151, 643),(151, 703),(151, 804),(154, 74),(154, 208),(154, 233),(154, 234),(154, 246),(154, 248),(154, 352),(154, 372),(154, 428),(154, 440),(154, 578),(154, 744),(154, 752),(154, 826),(154, 831),(154, 832),(154, 833),(155, 40),(155, 56),(155, 86),(155, 250),(155, 276),(155, 438),(155, 442),(155, 492),(155, 528),(155, 756);