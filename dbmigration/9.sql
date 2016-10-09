ALTER TABLE `geo_territories` ADD UNIQUE `iso3166_1_num` (`iso3166_1_num`), DROP INDEX `PRIMARY`;

ALTER TABLE `geo_territories` CHANGE `iso3166_1_num` `iso3166_1_num` smallint(5) unsigned NULL FIRST;

INSERT INTO `geo_territories` (`iso3166_1_num`, `iso3166_1_alpha_3`, `iso3166_1_alpha_2`, `slug`) VALUES (NULL, 'UNK', 'XK', 'kosovo');
INSERT INTO `geo_territoryLabels` (`terIso3166_1_alpha_2`, `labelIso639_3`, `label`, `labelShort`) VALUES ('XK', 'eng', 'Republic of Kosovo', 'Kosovo');
INSERT INTO `geo_territoryLabels` (`terIso3166_1_alpha_2`, `labelIso639_3`, `label`, `labelShort`) VALUES ('XK', 'swe', 'Republiken Kosovo', 'Kosovo');
