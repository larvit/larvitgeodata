
CREATE TABLE `geo_currencies` (
  `iso_4217` varchar(3) CHARACTER SET ascii NOT NULL,
  `description` varchar(193) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`iso_4217`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `geo_currencyLables` (
  `iso_4217` varchar(3) CHARACTER SET ascii NOT NULL,
  `displayName` varchar(193) COLLATE utf8mb4_unicode_ci NOT NULL,
  `symbol` varchar(8) COLLATE utf8mb4_unicode_ci,
  `langIso639_1` varchar(3) CHARACTER SET ascii NOT NULL,
  PRIMARY KEY (`iso_4217`,`langIso639_1`),
  KEY `langIso639_1` (`langIso639_1`),
  CONSTRAINT `geo_currencyLables_ibfk_1` FOREIGN KEY (`langIso639_1`) REFERENCES `geo_langs` (`iso639_1`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `geo_currencyLables_ibfk_3` FOREIGN KEY (`iso_4217`) REFERENCES `geo_currencies` (`iso_4217`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;