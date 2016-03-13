ALTER TABLE `geo_territories`
CHANGE `iso3166_1_alpha_3` `iso3166_1_alpha_3` char(3) COLLATE 'ascii_general_ci' NOT NULL AFTER `iso3166_1_num`,
CHANGE `iso3166_1_alpha_2` `iso3166_1_alpha_2` char(2) COLLATE 'ascii_general_ci' NOT NULL AFTER `iso3166_1_alpha_3`;

DROP TABLE `geo_territoryLabels`;
CREATE TABLE `geo_territoryLabels` (
  `terIso3166_1_alpha_2` char(2) CHARACTER SET ascii NOT NULL,
  `labelIso639_3` char(3) CHARACTER SET ascii NOT NULL,
  `label` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `labelShort` varchar(50) COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`terIso3166_1_alpha_2`,`labelIso639_3`),
  KEY `labelIso639_3` (`labelIso639_3`),
  CONSTRAINT `geo_territoryLabels_ibfk_1` FOREIGN KEY (`terIso3166_1_alpha_2`) REFERENCES `geo_territories` (`iso3166_1_alpha_2`),
  CONSTRAINT `geo_territoryLabels_ibfk_2` FOREIGN KEY (`labelIso639_3`) REFERENCES `geo_langs` (`iso639_3`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
