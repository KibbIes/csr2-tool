import { useState, useEffect } from "react";
import * as pako from "pako";

// ==========================================
// BACKEND
// ==========================================
const API_BASE = "";

// ==========================================
// HARDCODED CAR IDs
// ==========================================
const ALL_CAR_IDS = [
  "AMC_RingbrothersJavelinDefiant_1972", "ATSAutomobili_GTRewardRecycled_2018", "ATSAutomobili_GTReward_2018", "ATSAutomobili_RRTurbo_2020", "Abarth_500_2014", 
  "Acura_IntegraGSRF1_1998", "Acura_IntegraTypeRDB8F1_1995", "Acura_NSXF9_2018", "Acura_NSXTypeSRewardRecycled_2022", "Acura_NSXTypeSReward_2022", 
  "AlfaRomeo_4CCoupeCrewRecycled_2013", "AlfaRomeo_4CCoupeCrew_2013", "AlfaRomeo_4CSpider_2016", "AlfaRomeo_8CCompetizione_2007", "AlfaRomeo_8CSpiderRewardRecycled_2009", 
  "AlfaRomeo_8CSpiderReward_2009", "AlfaRomeo_GiuliaGTAmRewardRecycled_2021", "AlfaRomeo_GiuliaGTAmReward_2021", "AlfaRomeo_GiuliaQuadrifoglio_2017", "Alpine_A110_2018", 
  "Apollo_IntensaEmozioneCarbon_2019", "Apollo_IntensaEmozioneOrangeDragon_2019", "Apollo_IntensaEmozione_2019", "Apollo_ProjectEvo_2022", "Apollo_S_2008", 
  "Arrinera_HussaryaRewardRecycled_2020", "Arrinera_HussaryaReward_2020", "Aspark_OwlSP600_2024", "Aspark_Owl_2021", "AstonMartin_DB11RewardRecycled_2017", 
  "AstonMartin_DB11Reward_2017", "AstonMartin_DB12VolanteRewardRecycled_2024", "AstonMartin_DB12VolanteReward_2024", "AstonMartin_DB12_2023", "AstonMartin_DB5Classic_1964", 
  "AstonMartin_DBR22_2023", "AstonMartin_DBS770UltimateRewardRecycled_2023", "AstonMartin_DBS770UltimateReward_2023", "AstonMartin_DBSGTZagato_2020", "AstonMartin_DBSSuperleggeraRewardRecycled_2019", 
  "AstonMartin_DBSSuperleggeraReward_2019", "AstonMartin_DBSVolanteRewardRecycled_2020", "AstonMartin_DBSVolanteReward_2020", "AstonMartin_DBX707RewardRecycled_2023", "AstonMartin_DBX707Reward_2023", 
  "AstonMartin_DBXRewardRecycled_2019", "AstonMartin_DBXReward_2019", "AstonMartin_DBXSRewardRecycled_2026", "AstonMartin_DBXSReward_2026", "AstonMartin_One77RewardRecycled_2010", 
  "AstonMartin_One77Reward_2010", "AstonMartin_V12SpeedsterDBR1_2021", "AstonMartin_V12Speedster_2021", "AstonMartin_V12VantageRRewardRecycled_2023", "AstonMartin_V12VantageRReward_2023", 
  "AstonMartin_V12Vantage_2023", "AstonMartin_ValhallaGold_2020", "AstonMartin_Valhalla_2020", "AstonMartin_Valhalla_2025", "AstonMartin_Valiant_2025", 
  "AstonMartin_ValkyrieAMRProConcept_2020", "AstonMartin_ValkyrieAMRPro_2022", "AstonMartin_ValkyrieSpider_2022", "AstonMartin_ValkyrieSpirit_2020", "AstonMartin_ValkyrieTrackPackAMR_2020", 
  "AstonMartin_ValkyrieTrackPack_2020", "AstonMartin_Valkyrie_2020", "AstonMartin_ValourRewardRecycled_2024", "AstonMartin_ValourReward_2024", "AstonMartin_Valour_2024", 
  "AstonMartin_VanquishVRewardRecycled_2025", "AstonMartin_VanquishVReward_2025", "AstonMartin_VanquishZagatoRewardRecycled_2017", "AstonMartin_VanquishZagatoReward_2017", "AstonMartin_VanquishZagatoSB_2017", 
  "AstonMartin_Vanquish_2014", "AstonMartin_Vanquish_2025", "AstonMartin_VantageGT12_2016", "AstonMartin_VantageGTE_2020", "AstonMartin_VantageRRewardRecycled_2025", 
  "AstonMartin_VantageRReward_2025", "AstonMartin_VantageRoadsterRewardRecycled_2021", "AstonMartin_VantageRoadsterReward_2021", "AstonMartin_VantageV8RewardRecycled_2018", "AstonMartin_VantageV8Reward_2018", 
  "AstonMartin_Vantage_2024", "AstonMartin_Victor_2020", "AstonMartin_VulcanRewardGold_2016", "AstonMartin_VulcanRewardRecycled_2016", "AstonMartin_VulcanReward_2016", 
  "Audi_ABTRS6RRewardRecycled_2020", "Audi_ABTRS6RReward_2020", "Audi_ABTRS7RRewardRecycled_2020", "Audi_ABTRS7RReward_2020", "Audi_LBR8V10PlusCoupeElite_2014", 
  "Audi_LBR8V10PlusCoupeRewardRecycled_2014", "Audi_LBR8V10PlusCoupeReward_2014", "Audi_LBRS5CoupeElite_2014", "Audi_LBRS5Coupe_2014", "Audi_NEWINGR8RSRRewardRecycled_2016", 
  "Audi_NEWINGR8RSRReward_2016", "Audi_R18_2014", "Audi_R8LMSGT3_2019", "Audi_R8SpyderRewardRecycled_2020", "Audi_R8SpyderReward_2020", 
  "Audi_R8V10Decennium_2019", "Audi_R8V10GTRewardRecycled_2023", "Audi_R8V10GTReward_2023", "Audi_R8V10GreenHell_2020", "Audi_R8V10PlusCoupeRewardRecycled_2016", 
  "Audi_R8V10PlusCoupeReward_2016", "Audi_R8V10PlusCoupe_2014", "Audi_R8V10PlusCoupe_2016", "Audi_RS3SedanRewardRecycled_2023", "Audi_RS3SedanReward_2023", 
  "Audi_RS3SportbackRewardRecycled_2023", "Audi_RS3SportbackReward_2023", "Audi_RS5CoupeRewardRecycled_2020", "Audi_RS5CoupeReward_2020", "Audi_RS5Coupe_2014", 
  "Audi_RS6AvantGTRewardRecycled_2024", "Audi_RS6AvantGTReward_2024", "Audi_RS6AvantRewardRecycled_2020", "Audi_RS6AvantReward_2020", "Audi_RS7SportbackRewardRecycled_2020", 
  "Audi_RS7SportbackReward_2020", "Audi_RSetronGTRewardRecycled_2022", "Audi_RSetronGTReward_2022", "Audi_S1ETronQuattroHoonitron_2022", "Audi_TTRSCoupeIERewardRecycled_2023", 
  "Audi_TTRSCoupeIEReward_2023", "Audi_TTRSPlusCoupe_2014", "BAC_MonoRewardRecycled_2017", "BAC_MonoReward_2017", "BMW_30CSLE9LP_1973", 
  "BMW_ACSchnitzerM2Coupe_2016", "BMW_ACSchnitzerZ4_2019", "BMW_LBM4CoupeCrewRecycled_2014", "BMW_LBM4CoupeCrew_2014", "BMW_LBi8RewardRecycled_2017", 
  "BMW_LBi8Reward_2017", "BMW_M1_1985", "BMW_M235iCoupe_2014", "BMW_M2CSG87RewardRecycled_2025", "BMW_M2CSG87Reward_2025", 
  "BMW_M2Competition_2018", "BMW_M2CoupeG87RewardRecycled_2023", "BMW_M2CoupeG87Reward_2023", "BMW_M2G87MPerformance_2023", "BMW_M2G87TNR_2023", 
  "BMW_M3CSTouringRewardRecycled_2025", "BMW_M3CSTouringReward_2025", "BMW_M3E46GTR_2005", "BMW_M3E92CoupeGTSElite_2011", "BMW_M3E92CoupeGTSRewardRecycled_2011", 
  "BMW_M3E92CoupeGTSReward_2011", "BMW_M3SportEvoE30_1990", "BMW_M3TouringRewardRecycled_2022", "BMW_M3TouringReward_2022", "BMW_M4CSLRewardRecycled_2022", 
  "BMW_M4CSLReward_2022", "BMW_M4CompetitionG82TNR_2021", "BMW_M4CoupeMPerformance_2021", "BMW_M4CoupeRewardRecycled_2021", "BMW_M4CoupeReward_2021", 
  "BMW_M4Coupe_2014", "BMW_M4GT3_2022", "BMW_M4GTS_2016", "BMW_M5CSRewardRecycled_2022", "BMW_M5CSReward_2022", 
  "BMW_M5CompetitionRewardRecycled_2019", "BMW_M5CompetitionReward_2019", "BMW_M5G99Touring_2024", "BMW_M5SedanRewardRecycled_2024", "BMW_M5SedanReward_2024", 
  "BMW_M8Competition_2020", "BMW_M8ConvertiblePride_2021", "BMW_M8ConvertibleRewardRecycled_2021", "BMW_M8ConvertibleReward_2021", "BMW_M8RewardRecycled_2020", 
  "BMW_M8Reward_2020", "BMW_RBM3E92RewardRecycled_2011", "BMW_RBM3E92Reward_2011", "BMW_VarisM4GTSRewardRecycled_2016", "BMW_VarisM4GTSReward_2016", 
  "BMW_Z4MCoupeCrew_2006", "BMW_Z4_2019", "BMW_i8Elite_2017", "BMW_i8RewardHoliday_2017", "BMW_i8RewardRecycled_2017", 
  "BMW_i8RewardSilver_2017", "BMW_i8Reward_2017", "BTTF_TimeMachine1_1985", "BTTF_TimeMachine2_2015", "BTTF_TimeMachine3_1885", 
  "Bentley_BaturConvertibleRewardRecycled_2025", "Bentley_BaturConvertibleReward_2025", "Bentley_BentaygaRewardRecycled_2018", "Bentley_BentaygaReward_2018", "Bentley_ContinentalGT3PikesPeak_2021", 
  "Bentley_ContinentalGT3RRewardRecycled_2015", "Bentley_ContinentalGT3RReward_2015", "Bentley_ContinentalGT3RaceCar_2020", "Bentley_ContinentalGTCSpeedRewardRecycled_2022", "Bentley_ContinentalGTCSpeedReward_2022", 
  "Bentley_ContinentalGTConvertibleRewardRecycled_2019", "Bentley_ContinentalGTConvertibleReward_2019", "Bentley_ContinentalGTEVO_2026", "Bentley_ContinentalGTRewardRecycled_2018", "Bentley_ContinentalGTReward_2018", 
  "Bentley_ContinentalGTSpeedRewardRecycled_2021", "Bentley_ContinentalGTSpeedRewardRecycled_2025", "Bentley_ContinentalGTSpeedReward_2021", "Bentley_ContinentalGTSpeedReward_2025", "Bentley_ContinentalGTSpeed_2016", 
  "Bentley_ContinentalGTV8SF8_2014", "Bentley_MullinerBacalarRewardRecycled_2021", "Bentley_MullinerBacalarReward_2021", "Bentley_MullinerBaturRewardRecycled_2023", "Bentley_MullinerBaturReward_2023", 
  "Bentley_SupersportsRewardRecycled_2026", "Bentley_SupersportsReward_2026", "Brabham_BT62Evo_2019", "Brabham_BT62RRewardRecycled_2020", "Brabham_BT62RReward_2020", 
  "Brabham_BT62_2019", "Bugatti_AtlanticConceptRewardRecycled_2015", "Bugatti_AtlanticConceptReward_2015", "Bugatti_AtlanticConcept_2015", "Bugatti_Chiron42Seconds_2016", 
  "Bugatti_ChironProfilee_2022", "Bugatti_ChironProjectHero_2016", "Bugatti_ChironPurSportEditionGP_2022", "Bugatti_ChironRLB_2020", "Bugatti_ChironRMS_2020", 
  "Bugatti_ChironRewardGold_2016", "Bugatti_ChironRewardRecycled_2016", "Bugatti_ChironReward_2016", "Bugatti_ChironSport110_2018", "Bugatti_ChironSport_2016", 
  "Bugatti_ChironSuperSportWRE_2020", "Bugatti_ChironSuperSport_2022", "Bugatti_Divo110_2019", "Bugatti_DivoGold_2019", "Bugatti_Divo_2019", 
  "Bugatti_EB110HomageLB_2019", "Bugatti_EB110HomageMS_2019", "Bugatti_EB110SSClassic_1992", "Bugatti_LaVoitureNoire_2019", "Bugatti_LaVoitureNoire_2022", 
  "Bugatti_Tourbillon_2026", "Bugatti_VeyronGrandSportVitesseAndroid_2012", "Bugatti_VeyronGrandSportVitesseWRE_2012", "Bugatti_VeyronGrandSportVitesse_2012", "Bugatti_VeyronGrandSportVitesseiOS_2012", 
  "Bugatti_VeyronSuperSportGold_2012", "Bugatti_VeyronSuperSport_2012", "Bugatti_W16MistralRewardRecycled_2023", "Bugatti_W16MistralReward_2023", "Bugatti_W16MistralWRE_2024", 
  "Bugatti_W16Mistral_2023", "Bugatti_X16Gold_2024", "Bugatti_X16_2024", "Buick_GNX_1987", "Buick_GrandNationalF4_1987", 
  "Buick_RingbrothersGNX_1987", "Buick_RoadstershopGrandNational_1987", "Cadillac_CT5VBlackwingRewardRecycled_2022", "Cadillac_CT5VBlackwingReward_2022", "Cadillac_CTSVRewardRecycled_2017", 
  "Cadillac_CTSVReward_2017", "Chevrolet_AlphaSixCamaroSSCrewRecycled_2016", "Chevrolet_AlphaSixCamaroSSCrew_2016", "Chevrolet_AmericanLegendsChevelle_1966", "Chevrolet_BBTImpala_1959", 
  "Chevrolet_BlazinRodsChevelle_1970", "Chevrolet_C10Elite_2016", "Chevrolet_C10Halloween_2016", "Chevrolet_C10RewardRecycled_2016", "Chevrolet_C10RewardVIP_2016", 
  "Chevrolet_C10Reward_2016", "Chevrolet_COPOCamaroRewardEvo_2019", "Chevrolet_COPOCamaroRewardRecycled_2019", "Chevrolet_COPOCamaroReward_2019", "Chevrolet_Camaro632_1988", 
  "Chevrolet_CamaroSSNASCARXfinity_2021", "Chevrolet_CamaroSS_2016", "Chevrolet_CamaroZ28ASC_2015", "Chevrolet_CamaroZ28_2015", "Chevrolet_CamaroZL11LERewardRecycled_2018", 
  "Chevrolet_CamaroZL11LEReward_2018", "Chevrolet_CamaroZL1CrewRecycled_2017", "Chevrolet_CamaroZL1Crew_2017", "Chevrolet_CamaroZL1NASCAR_2022", "Chevrolet_CapriceDonk_1971", 
  "Chevrolet_CorvetteC1LPClassic_1958", "Chevrolet_CorvetteC4ZR1_1994", "Chevrolet_CorvetteC6ZR1_2012", "Chevrolet_CorvetteC7REditionRewardRecycled_2015", "Chevrolet_CorvetteC7REditionReward_2015", 
  "Chevrolet_CorvetteC8Convertible_2020", "Chevrolet_CorvetteC8RLB_2020", "Chevrolet_CorvetteC8RMS_2020", "Chevrolet_CorvetteC8RewardRecycled_2020", "Chevrolet_CorvetteC8Reward_2020", 
  "Chevrolet_CorvetteC8ZR1RewardRecycled_2024", "Chevrolet_CorvetteC8ZR1Reward_2024", "Chevrolet_CorvetteC8ZR1_2024", "Chevrolet_CorvetteGrandSport_2017", "Chevrolet_CorvetteStingRayC2F8_1966", 
  "Chevrolet_CorvetteStingrayTNR_2020", "Chevrolet_CorvetteStingray_2015", "Chevrolet_CorvetteZ06C8CRewardRecycled_2023", "Chevrolet_CorvetteZ06C8CReward_2023", "Chevrolet_CorvetteZ06RewardRecycled_2023", 
  "Chevrolet_CorvetteZ06Reward_2023", "Chevrolet_CorvetteZ06Z07Package_2023", "Chevrolet_CorvetteZR1Classic_1970", "Chevrolet_CorvetteZR1RewardRecycled_2018", "Chevrolet_CorvetteZR1Reward_2018", 
  "Chevrolet_CorvetteZR1SH1_2018", "Chevrolet_DuSoldDesignCamaro_1967", "Chevrolet_DutchboysCamaroLB_1969", "Chevrolet_DutchboysCamaroMS_1969", "Chevrolet_EddiesCorvetteC2_1963", 
  "Chevrolet_GAPCorvette_1972", "Chevrolet_GarretCamaro_1972", "Chevrolet_GreeningCamaroIROCZ_1985", "Chevrolet_HSCustomsCamaroRewardRecycled_2016", "Chevrolet_HSCustomsCamaroReward_2016", 
  "Chevrolet_HSCustomsChevelle_1968", "Chevrolet_KellySonBelAir_1957", "Chevrolet_LBCamaroIROCZRewardRecycled_1987", "Chevrolet_LBCamaroIROCZReward_1987", "Chevrolet_LMCorvetteC8_2020", 
  "Chevrolet_LMCorvetteZ06RewardRecycled_2023", "Chevrolet_LMCorvetteZ06Reward_2023", "Chevrolet_LostAngelsCamaro_1970", "Chevrolet_LowerLevelGarageApache_1959", "Chevrolet_MonteCarloRaceCarF9_1995", 
  "Chevrolet_NASCARCamaroZL1JE_2020", "Chevrolet_NASCARCamaroZL1_2020", "Chevrolet_NapalmNova_1972", "Chevrolet_NovaSSF9_1970", "Chevrolet_NovaSSLPClassic_1970", 
  "Chevrolet_PandeMCamaroZ28_1972", "Chevrolet_PickUpVerminsDinerOG_1936", "Chevrolet_PickUpVerminsDiner_1936", "Chevrolet_QuintinBrotherCamaroRewardRecycled_1968", "Chevrolet_QuintinBrotherCamaroReward_1968", 
  "Chevrolet_RBCorvetteC8StingrayRewardRecycled_2020", "Chevrolet_RBCorvetteC8StingrayReward_2020", "Chevrolet_RingbrothersCamaroUSA_1969", "Chevrolet_RingbrothersCamaro_1969", "Chevrolet_RingbrothersChevelle_1966", 
  "Chevrolet_RingbrothersPickUp_1948", "Chevrolet_RoadsterShopCamaro_1970", "Chevrolet_SickSecondsCamaroSS_1969", "Chevrolet_TimmBuiltElCamino_1978", "Chevrolet_WeaverCamaro_1969", 
  "Chevrolet_WeaverCustoms3100_1949", "Chevrolet_WolfeKustomsBelAir_1957", "Chevrolet_ZwygartNova_1967", "Czinger_21CGold_2021", "Czinger_21CVMax_2023", 
  "Czinger_21C_2021", "Dallara_EXP_2021", "Dallara_StradaleRewardRecycled_2019", "Dallara_StradaleReward_2019", "Dallara_Stradale_2019", 
  "Datsun_240ZLPClassic_1972", "DeTomaso_P900_2022", "DeTomaso_PanteraGT5S_1984", "Devel_Sixteen_2022", "Dodge_ChallengerMoparDragPakGold_2021", 
  "Dodge_ChallengerMoparDragPak_2021", "Dodge_ChallengerRTLPClassic_1970", "Dodge_ChallengerRTShakerF7_2015", "Dodge_ChallengerSRTDemonF8_2018", "Dodge_ChallengerSRTDemonRewardRecycled_2018", 
  "Dodge_ChallengerSRTDemonReward_2018", "Dodge_ChallengerSRTHellcatRewardRecycled_2015", "Dodge_ChallengerSRTHellcatReward_2015", "Dodge_ChallengerSRTHellcat_2015", "Dodge_ChallengerSRTSuperStockRewardRecycled_2021", 
  "Dodge_ChallengerSRTSuperStockReward_2021", "Dodge_ChargerDaytonaF6_1970", "Dodge_ChargerDaytonaHalloween_1970", "Dodge_ChargerDaytonaScatPack_2025", "Dodge_ChargerDaytona_1970", 
  "Dodge_ChargerHellcatDaytona50th_2020", "Dodge_ChargerHellcatRedeyeRewardRecycled_2021", "Dodge_ChargerHellcatRedeyeReward_2021", "Dodge_ChargerHellcat_2020", "Dodge_ChargerRTCrew_1969", 
  "Dodge_ChargerRTF1_1970", "Dodge_ChargerRTF4_1970", "Dodge_ChargerRTF8_1970", "Dodge_ChargerRTF9_1966", "Dodge_ChargerRedeyeSplatter_2023", 
  "Dodge_ChargerSixpackRewardRecycled_2025", "Dodge_ChargerSixpackReward_2025", "Dodge_ChargerTantrumF9_1970", "Dodge_DemonChargerF9_2018", "Dodge_HPE1200DemonGold_2018", 
  "Dodge_HPE1200Demon_2018", "Dodge_HavocChallenger_1970", "Dodge_RingbrosChargerCAPTIV_1969", "Dodge_RingbrothersChargerTUSK_1969", "Dodge_SRTDemon170RewardRecycled_2023", 
  "Dodge_SRTDemon170Reward_2023", "Dodge_SpeedShopCharger_1968", "Dodge_ViperACRCrew_2016", "Dodge_ViperACRExtremeAeroPackage_2016", "Dodge_ViperACRRewardRecycled_2016", 
  "Dodge_ViperACRReward_2016", "Dodge_ViperACRVoodooII_2016", "Dodge_ViperACR_2009", "Dodge_ViperGTS_1996", "Dodge_ViperGTS_2015", 
  "Dodge_ViperSR1LPClassic_1995", "Dodge_ViperSnakeskinEditionGTC_2017", "Dodge_WidebodyChargerF9_1968", "Donkervoort_D8GTORewardRecycled_2015", "Donkervoort_D8GTOReward_2015", 
  "FSD_ConceptCar_2027", "Ferrari_12CilindriRewardRecycled_2024", "Ferrari_12CilindriReward_2024", "Ferrari_12CilindriSpiderRewardRecycled_2024", "Ferrari_12CilindriSpiderReward_2024", 
  "Ferrari_250GTOClassic_1962", "Ferrari_288GTO_1985", "Ferrari_296GTBAssettoFiorano_2022", "Ferrari_296GTB_2022", "Ferrari_296GTSRewardRecycled_2023", 
  "Ferrari_296GTSReward_2023", "Ferrari_296SpecialeA_2026", "Ferrari_296SpecialeRewardRecycled_2026", "Ferrari_296SpecialeReward_2026", "Ferrari_458Speciale_2014", 
  "Ferrari_488GTB70thAnniversary_2015", "Ferrari_488GTModificata_2021", "Ferrari_488PistaRewardRecycled_2019", "Ferrari_488PistaReward_2019", "Ferrari_488PistaSpiderRewardRecycled_2019", 
  "Ferrari_488PistaSpiderReward_2019", "Ferrari_488Spider70thAnniversary_2015", "Ferrari_488Spider_2015", "Ferrari_512TR_1991", "Ferrari_599GTORewardRecycled_2010", 
  "Ferrari_599GTOReward_2010", "Ferrari_599XXEvoluzione_2011", "Ferrari_599XXRewardRecycled_2010", "Ferrari_599XXReward_2010", "Ferrari_812CompetizioneRewardRecycled_2021", 
  "Ferrari_812CompetizioneReward_2021", "Ferrari_812Competizione_2021", "Ferrari_812GTSRewardRecycled_2020", "Ferrari_812GTSReward_2020", "Ferrari_812SuperfastRewardRecycled_2018", 
  "Ferrari_812SuperfastReward_2018", "Ferrari_849Testarossa_2026", "Ferrari_AmalfiRewardRecycled_2027", "Ferrari_AmalfiReward_2027", "Ferrari_California30RewardRecycled_2012", 
  "Ferrari_California30Reward_2012", "Ferrari_CaliforniaT70thAnniversary_2015", "Ferrari_DaytonaSP3_2022", "Ferrari_Dino246GTS_1973", "Ferrari_EnzoGold_2002", 
  "Ferrari_Enzo_2002", "Ferrari_F12berlinetta70thAnniversary_2014", "Ferrari_F12berlinetta_2014", "Ferrari_F12tdfRewardRecycled_2016", "Ferrari_F12tdfReward_2016", 
  "Ferrari_F355Berlinetta_1994", "Ferrari_F40Competizione_1989", "Ferrari_F40RewardRecycled_1987", "Ferrari_F40Reward_1987", "Ferrari_F430Scuderia_2008", 
  "Ferrari_F50CrewRecycled_1995", "Ferrari_F50Crew_1995", "Ferrari_F50GT_1996", "Ferrari_F8SpiderRewardRecycled_2020", "Ferrari_F8SpiderReward_2020", 
  "Ferrari_F8TributoRewardRecycled_2020", "Ferrari_F8TributoReward_2020", "Ferrari_FXXEvoluzione_2008", "Ferrari_FXXKEvo_2018", "Ferrari_FXXKRewardRecycled_2014", 
  "Ferrari_FXXKReward_2014", "Ferrari_GTC4Lusso70thAnniversary_2016", "Ferrari_GTC4LussoRewardRecycled_2016", "Ferrari_GTC4LussoReward_2016", "Ferrari_LaFerrariAperta70thAnniversary_2017", 
  "Ferrari_LaFerrariAperta_2017", "Ferrari_LaFerrari_2014", "Ferrari_MV512Testarossa_1986", "Ferrari_MonzaRewardRecycled_2019", "Ferrari_MonzaReward_2019", 
  "Ferrari_PortofinoRewardRecycled_2018", "Ferrari_PortofinoReward_2018", "Ferrari_PurosangueRewardRecycled_2023", "Ferrari_PurosangueReward_2023", "Ferrari_RomaRewardRecycled_2020", 
  "Ferrari_RomaReward_2020", "Ferrari_SF90SpiderRewardRecycled_2021", "Ferrari_SF90SpiderReward_2021", "Ferrari_SF90StradaleAssettoFioranoF175_2021", "Ferrari_SF90StradaleAssettoFiorano_2021", 
  "Ferrari_SF90StradaleGold_2020", "Ferrari_SF90Stradale_2020", "Ferrari_SF90XXSpiderRewardRecycled_2024", "Ferrari_SF90XXSpiderReward_2024", "Ferrari_SF90XXStradale_2024", 
  "FnF_FlipCar_2013", "FnF_SupraMKIVF2_1994", "Ford_Durty30Gold_2016", "Ford_Durty30_2016", "Ford_DutchboysTorino_1969", 
  "Ford_EscortMKIF6_1970", "Ford_EscortMk1RS2000LPClassic_1973", "Ford_EscortRSCosworthCossieV2_1994", "Ford_F150Hoonitruck_1977", "Ford_F150SVTRaptorElite_2014", 
  "Ford_F150SVTRaptor_2014", "Ford_FiestaST_2016", "Ford_FocusRSElite_2017", "Ford_FocusRS_2017", "Ford_FocusSTCrewRecycled_2014", 
  "Ford_FocusSTCrew_2014", "Ford_GT40MkII1_1966", "Ford_GT40MkII_1966", "Ford_GTDaytonaHeritageEdition_2021", "Ford_GTElite_2017", 
  "Ford_GTHeritageEdition_2005", "Ford_GTHeritageEdition_2017", "Ford_GTLeMansRacecar_2016", "Ford_GTMk4_2024", "Ford_GTRewardRecycled66_2017", 
  "Ford_GTRewardRecycled_2017", "Ford_GTReward_2017", "Ford_GT_2005", "Ford_Mustang302_1970", "Ford_MustangCobraJetVIP_2019", 
  "Ford_MustangCobraJet_2019", "Ford_MustangDarkHorseSCRewardRecycled_2025", "Ford_MustangDarkHorseSCReward_2025", "Ford_MustangDarkHorse_2024", "Ford_MustangF3_1967", 
  "Ford_MustangFastbackF6_1969", "Ford_MustangFoxbodyF9_1987", "Ford_MustangGT350F9_2016", "Ford_MustangGTD_2025", "Ford_MustangGTFastbackTNR_2018", 
  "Ford_MustangGTHPE750Silver_2015", "Ford_MustangGTHoonicornV1_1965", "Ford_MustangGTHoonicornV2_1965", "Ford_MustangGTPremiumBoss_2015", "Ford_MustangGTPremiumElite_2015", 
  "Ford_MustangGTPremium_2015", "Ford_MustangGT_2024", "Ford_MustangMach1_2021", "Ford_MustangMachE1400_2021", "Ford_MustangMachEGTRewardRecycled_2021", 
  "Ford_MustangMachEGTReward_2021", "Ford_MustangNASCAR_2022", "Ford_MustangRTRSPEC5_2019", "Ford_MustangRTRSpec3_2019", "Ford_MustangSVTCobraRLPClassic_1993", 
  "Ford_MustangSVTCobraR_2000", "Ford_MustangShelbyGT350LPClassic_1965", "Ford_MustangShelbyGT500RewardRecycled_2019", "Ford_MustangShelbyGT500Reward_2019", "Ford_ROUSHStage3Mustang_2019", 
  "Ford_RadRidesTroyRoadster_1936", "Ford_RingbrothersMustangMach1_1969", "Ford_RingbrothersMustang_1969", "Ford_RoushStage3Mustang_1996", "Ford_RuffianGT40_1966", 
  "Ford_RuffianGalaxie500_1964", "Ford_RuffianMustangFIAFastback_1967", "Ford_RuffianMustang_1970", "Ford_ShelbyGT350RElite_2016", "Ford_ShelbyGT350R_2016", 
  "Ford_SpeedShopF100_1956", "Ford_Supervan4_2022", "Ford_WeaverCustomsModelAElite_1931", "Ford_WeaverCustomsModelALB_1931", "Ford_WeaverCustomsModelAMS_1931", 
  "Ford_WeaverCustomsMustangFastback_1968", "GTA_SpanoCrewRecycled_2015", "GTA_SpanoCrew_2015", "Ginetta_AkulaGold_2019", "Ginetta_Akula_2019", 
  "Hennessey_CamaroExorcistRewardRecycled_2017", "Hennessey_CamaroExorcistReward_2017", "Hennessey_CamaroTheResurrection_2017", "Hennessey_VenomF5Gold_2020", "Hennessey_VenomF5RevRRewardRecycled_2025", 
  "Hennessey_VenomF5RevRReward_2025", "Hennessey_VenomF5Revolution_2023", "Hennessey_VenomF5RoadsterRewardRecycled_2023", "Hennessey_VenomF5RoadsterReward_2023", "Hennessey_VenomF5_2020", 
  "Hennessey_VenomF5_2021", "Hennessey_VenomGTSpyderRewardGold_2016", "Hennessey_VenomGTSpyderRewardRecycled_2016", "Hennessey_VenomGTSpyderReward_2016", "Hennessey_VenomGT_2012", 
  "Honda_AIMGAINGTNSXEvo_2017", "Honda_AIMGAINGTNSXRewardRecycled_2017", "Honda_AIMGAINGTNSXReward_2017", "Honda_Civic15VTECCrewRecycled_1994", "Honda_Civic15VTECCrew_1994", 
  "Honda_CivicEGTNR_1995", "Honda_CivicEJ1F1_1993", "Honda_CivicTypeRElite_2017", "Honda_CivicTypeRRewardRecycled_2023", "Honda_CivicTypeRReward_2023", 
  "Honda_CivicTypeRTNR_2017", "Honda_CivicTypeRVaris_2017", "Honda_CivicTypeR_2017", "Honda_IndyTruck_2017", "Honda_LBNSXRewardRecycled_2017", 
  "Honda_LBNSXReward_2017", "Honda_NSXLBWorksRewardRecycled_1992", "Honda_NSXLBWorksReward_1992", "Honda_NSXRClassic_1992", "Honda_NSXRewardRecycled_2017", 
  "Honda_NSXReward_2017", "Honda_NSXRocketBunny_1992", "Honda_NSXTNR_1992", "Honda_S2000F1_2001", "Honda_S2000F2_2001", 
  "Honda_S2000TNR_2001", "Honda_VarisS2000RewardRecycled_2005", "Honda_VarisS2000Reward_2005", "Honda_VeilsideNSXRewardRecycled_1995", "Honda_VeilsideNSXReward_1995", 
  "Hyperion_XP1_2023", "Hyundai_ElantraNRewardRecycled_2022", "Hyundai_ElantraNReward_2022", "Hyundai_IONIQ5NNPX1RewardRecycled_2024", "Hyundai_IONIQ5NNPX1Reward_2024", 
  "Hyundai_IONIQ6NRewardRecycled_2025", "Hyundai_IONIQ6NReward_2025", "Hyundai_Ioniq5NRewardRecycled_2023", "Hyundai_Ioniq5NReward_2023", "Hyundai_NVision74Concept_2023", 
  "Hyundai_VelosterTurboRSpecARK_2014", "Hyundai_VelosterTurboRSpecCrew_2014", "Hyundai_VelosterTurboRSpec_2014", "Indy_Car_2021", "Infiniti_Q60ProjectBlackSRewardRecycled_2018", 
  "Infiniti_Q60ProjectBlackSReward_2018", "Italdesign_ZerounoDuerta_2018", "Italdesign_ZerounoRewardRecycled_2017", "Italdesign_ZerounoReward_2017", "Jaguar_CX75PrototypeCrew_2013", 
  "Jaguar_CX75PrototypeRewardRecycled_2013", "Jaguar_CX75PrototypeReward_2013", "Jaguar_FTYPERConvertibleRewardRecycled_2021", "Jaguar_FTYPERConvertibleReward_2021", "Jaguar_FTypeRCoupeF8_2016", 
  "Jaguar_FTypeRCoupe_2016", "Jaguar_FTypeSVRCoupeRewardRecycled_2019", "Jaguar_FTypeSVRCoupeReward_2019", "Jaguar_Project7Boss_2016", "Jaguar_Project7VIP_2016", 
  "Jaguar_XESVProject8F9_2018", "Jaguar_XESVProject8RewardRecycled_2018", "Jaguar_XESVProject8Reward_2018", "Jaguar_XJ220Classic_1993", "Jaguar_XJR15_1991", 
  "Jaguar_XKRSGT_2014", "Jeep_GladiatorF9_2019", "Jeep_GladiatorRewardRecycled_2019", "Jeep_GladiatorReward_2019", "Jeep_GrandCherokeeTrackhawkF9_2018", 
  "Jeep_GrandCherokeeTrackhawk_2018", "KTM_XBowGTX_2020", "KTM_XBowRRewardRecycled_2011", "KTM_XBowRReward_2011", "Kia_StingerGTS_2020", 
  "Kimera_EVO37Gold_2022", "Kimera_EVO37Martini_2024", "Kimera_EVO37_2022", "Kimera_EVO38_2024", "Koenigsegg_AgeraRSRewardRecycled_2017", 
  "Koenigsegg_AgeraRSReward_2017", "Koenigsegg_AgeraR_2013", "Koenigsegg_CC850_2023", "Koenigsegg_GemeraLE_2021", "Koenigsegg_Gemera_2021", 
  "Koenigsegg_Gemera_2025", "Koenigsegg_JeskoAbsolut_2021", "Koenigsegg_JeskoGold_2020", "Koenigsegg_JeskoRoofless_2020", "Koenigsegg_Jesko_2020", 
  "Koenigsegg_One1_2014", "Koenigsegg_RegeraHalloween_2016", "Koenigsegg_RegeraRewardGold_2016", "Koenigsegg_RegeraRewardRecycled_2016", "Koenigsegg_RegeraReward_2016", 
  "Lamborghini_Autentica_2023", "Lamborghini_AventadorLP7004_2011", "Lamborghini_AventadorLP7504Superveloce_2015", "Lamborghini_AventadorSJRewardRecycled_2021", "Lamborghini_AventadorSJReward_2021", 
  "Lamborghini_AventadorSVJRewardRecycled_2019", "Lamborghini_AventadorSVJReward_2019", "Lamborghini_AventadorSVJRoadsterRewardRecycled_2020", "Lamborghini_AventadorSVJRoadsterReward_2020", "Lamborghini_AventadorSVJRoadster_2020", 
  "Lamborghini_AventadorTNR_2021", "Lamborghini_CentenarioRoadsterAdPersonam_2017", "Lamborghini_CentenarioRoadsterAndroid_2017", "Lamborghini_CentenarioRoadsteriOS_2017", "Lamborghini_Centenario_2017", 
  "Lamborghini_CountachClassic_1988", "Lamborghini_CountachLPI8004RewardRecycled_2022", "Lamborghini_CountachLPI8004Reward_2022", "Lamborghini_CountachLPI8004_2022", "Lamborghini_DiabloGT_2000", 
  "Lamborghini_DiabloSV_1997", "Lamborghini_EssenzaSCV12Monterey_2021", "Lamborghini_EssenzaSCV12Nero_2021", "Lamborghini_EssenzaSCV12_2021", "Lamborghini_Fenomeno_2026", 
  "Lamborghini_FewOffAdPersonam_2020", "Lamborghini_FewOff_2020", "Lamborghini_HuracanEVOTNR_2021", "Lamborghini_HuracanEvoRewardRecycled_2019", "Lamborghini_HuracanEvoReward_2019", 
  "Lamborghini_HuracanEvoSpyderRewardRecycled_2019", "Lamborghini_HuracanEvoSpyderReward_2019", "Lamborghini_HuracanGT3EVORacecar_2019", "Lamborghini_HuracanGT3Evo2_2024", "Lamborghini_HuracanLP6104RewardRecycled_2014", 
  "Lamborghini_HuracanLP6104Reward_2014", "Lamborghini_HuracanLP6104_2014", "Lamborghini_HuracanPerformanteRewardRecycled_2018", "Lamborghini_HuracanPerformanteReward_2018", "Lamborghini_HuracanPerformanteSpyder_2019", 
  "Lamborghini_HuracanSTOEVO_2021", "Lamborghini_HuracanSTO_2021", "Lamborghini_HuracanSterratoHoliday_2021", "Lamborghini_HuracanSterratoRewardRecycled_2021", "Lamborghini_HuracanSterratoReward_2021", 
  "Lamborghini_HuracanTecnicaRewardRecycled_2023", "Lamborghini_HuracanTecnicaReward_2023", "Lamborghini_IVRewardRecycled_2024", "Lamborghini_IVReward_2024", "Lamborghini_Invencible_2023", 
  "Lamborghini_LB634_2024", "Lamborghini_LBAventadorLP7004RewardGold_2011", "Lamborghini_LBAventadorLP7004RewardRecycled_2011", "Lamborghini_LBAventadorLP7004RewardVIP_2011", "Lamborghini_LBAventadorLP7004Reward_2011", 
  "Lamborghini_LBCountachLPRewardRecycled_1988", "Lamborghini_LBCountachLPReward_1988", "Lamborghini_LBMurcielagoSVRewardRecycled_2009", "Lamborghini_LBMurcielagoSVReward_2009", "Lamborghini_LBSilhouetteHuracanRewardRecycled_2014", 
  "Lamborghini_LBSilhouetteHuracanReward_2014", "Lamborghini_LBWKMurcielagoRewardRecycled_2009", "Lamborghini_LBWKMurcielagoReward_2009", "Lamborghini_MiuraSVLPClassic_1971", "Lamborghini_MurcielagoLP640F8_2006", 
  "Lamborghini_MurcielagoSVRewardRecycled_2009", "Lamborghini_MurcielagoSVReward_2009", "Lamborghini_Reventon_2008", "Lamborghini_RevueltoRewardRecycled_2024", "Lamborghini_RevueltoReward_2024", 
  "Lamborghini_RevueltoSS1_2024", "Lamborghini_RevueltoSS2_2024", "Lamborghini_RevueltoSV_2027", "Lamborghini_SC18Alston_2019", "Lamborghini_SC20_2020", 
  "Lamborghini_SC63LMDH_2024", "Lamborghini_SestoElementoCrewRecycled_2012", "Lamborghini_SestoElementoCrew_2012", "Lamborghini_SianRoadster_2021", "Lamborghini_TemerarioRewardRecycled_2025", 
  "Lamborghini_TemerarioReward_2025", "Lamborghini_TerzoMillennio_2017", "Lamborghini_UrusPHEVRewardRecycled_2024", "Lamborghini_UrusPHEVReward_2024", "Lamborghini_UrusPerformanteRewardRecycled_2023", 
  "Lamborghini_UrusPerformanteReward_2023", "Lamborghini_UrusRewardRecycled_2018", "Lamborghini_UrusReward_2018", "Lamborghini_VenenoGold_2013", "Lamborghini_VenenoRoadsterGold_2014", 
  "Lamborghini_VenenoRoadster_2014", "Lamborghini_Veneno_2013", "Lamborghini_ZacoeTemerarioRewardRecycled_2024", "Lamborghini_ZacoeTemerarioReward_2024", "Lancia_DeltaHFIntegraleEvo2_1994", 
  "Landrover_RangeRoverEvoqueCoupeCrewRecycled_2016", "Landrover_RangeRoverEvoqueCoupeCrew_2016", "Lexus_LC500ConvertibleRewardRecycled_2017", "Lexus_LC500ConvertibleReward_2017", "Lexus_LC500TNR_2018", 
  "Lexus_LFAGold_2011", "Lexus_LFANurburgringPackage_2011", "Lexus_LFA_2011", "LocalMotor_RallyFighterF8_2013", "LocalMotor_RallyFighter_2013", 
  "Lotus_Emira_2022", "Lotus_EvijaRewardRecycled_2020", "Lotus_EvijaReward_2020", "Lotus_Evija_2020", "Lotus_EvoraGT430RewardRecycled_2018", 
  "Lotus_EvoraGT430Reward_2018", "Lotus_Exige360CupCrewRecycled_2016", "Lotus_Exige360CupCrew_2016", "Lotus_ExigeLF1_2014", "Lotus_ExigeS_2014", 
  "Lotus_Type131RewardRecycled_2022", "Lotus_Type131Reward_2022", "Lotus_VorsteinerEmiraRewardRecycled_2022", "Lotus_VorsteinerEmiraReward_2022", "Maserati_7DesignMC20VIP_2021", 
  "Maserati_GhibliSQ4_2014", "Maserati_GranTurismoMCRewardRecycled_2018", "Maserati_GranTurismoMCReward_2018", "Maserati_LBGranTurismoS_2018", "Maserati_MC12BC_2004", 
  "Maserati_MC12CarbonBlue_2004", "Maserati_MC12_2004", "Maserati_MC20CieloRewardRecycled_2023", "Maserati_MC20CieloReward_2023", "Maserati_MC20Coupe_2021", 
  "Mazda_Furai_2008", "Mazda_KRCJapanRX8RewardRecycled_2004", "Mazda_KRCJapanRX8Reward_2004", "Mazda_LBSuperSilhouetteRX7SE_1993", "Mazda_LBSuperSilhouetteRX7_1993", 
  "Mazda_MX5Gold_2016", "Mazda_MX5_2016", "Mazda_PandeMMX5_2016", "Mazda_RBRX8_2004", "Mazda_RX7F1_1993", 
  "Mazda_RX7F2_1993", "Mazda_RX7F3_1993", "Mazda_RX7RSPantera_1993", "Mazda_RX7RewardEaster_1993", "Mazda_RX7RewardRecycled_1993", 
  "Mazda_RX7Reward_1993", "Mazda_RX7TNR_1993", "Mazda_RX8F3_2004", "Mazda_RX8TNR_2008", "Mazzanti_EvantraMillecavalliGold_2019", 
  "Mazzanti_EvantraMillecavalli_2019", "McLaren_570S_2016", "McLaren_600LTRewardRecycled_2019", "McLaren_600LTReward_2019", "McLaren_600LTSpiderRewardRecycled_2020", 
  "McLaren_600LTSpiderReward_2020", "McLaren_650S_2015", "McLaren_675LTSpiderRewardRecycled_2016", "McLaren_675LTSpiderReward_2016", "McLaren_720SGT3X_2021", 
  "McLaren_720SGT3_2019", "McLaren_720SSpiderRewardRecycled_2019", "McLaren_720SSpiderReward_2019", "McLaren_720STNR_2017", "McLaren_750SRewardRecycled_2023", 
  "McLaren_750SReward_2023", "McLaren_765LTSpiderRewardRecycled_2021", "McLaren_765LTSpiderReward_2021", "McLaren_765LT_2021", "McLaren_ArturaRewardRecycled_2022", 
  "McLaren_ArturaReward_2022", "McLaren_ArturaSpiderRewardRecycled_2024", "McLaren_ArturaSpiderReward_2024", "McLaren_ElvaGOSH_2021", "McLaren_ElvaGold_2021", 
  "McLaren_ElvaMSO_2021", "McLaren_ElvaWindscreenRewardRecycled_2021", "McLaren_ElvaWindscreenReward_2021", "McLaren_Elva_2021", "McLaren_F1GT_1997", 
  "McLaren_F1LM_1995", "McLaren_F1_1993", "McLaren_GTRewardRecycled_2020", "McLaren_GTReward_2020", "McLaren_LB650SRewardGold_2015", 
  "McLaren_LB650SRewardRecycled_2015", "McLaren_LB650SReward_2015", "McLaren_P14CoupeRewardRecycled_2017", "McLaren_P14CoupeReward_2017", "McLaren_P14CoupeSH1_2017", 
  "McLaren_P1GTREvo_2015", "McLaren_P1GTRRewardRecycled_2015", "McLaren_P1GTRReward_2015", "McLaren_P1_2014", "McLaren_SLR722EditionCrew_2007", 
  "McLaren_SLR722EditionRewardRecycled_2006", "McLaren_SLR722EditionReward_2006", "McLaren_SLR722SRoadster_2009", "McLaren_Sabre_2022", "McLaren_SennaCarbon_2018", 
  "McLaren_SennaGOSH_2018", "McLaren_SennaGTRLM_2020", "McLaren_SennaGTR_2020", "McLaren_SennaLE_2018", "McLaren_Senna_2018", 
  "McLaren_SolusGT_2023", "McLaren_SpeedtailOrange_2019", "McLaren_SpeedtailRedSEG_2019", "McLaren_SpeedtailRed_2019", "McLaren_Speedtail_2019", 
  "McLaren_Vorsteiner570VXRewardRecycled_2016", "McLaren_Vorsteiner570VXReward_2016", "McLaren_Vorsteiner720SRewardRecycled_2018", "McLaren_Vorsteiner720SReward_2018", "McLaren_W1_2025", 
  "McMurtry_Speirling_2022", "MercedesAMGF1_W11VB_2020", "MercedesAMGF1_W11_2020", "MercedesAMG_CLAEVRewardRecycled_2025", "MercedesAMG_CLAEVReward_2025", 
  "MercedesAMG_CLE53CoupeRewardRecycled_2024", "MercedesAMG_CLE53CoupeReward_2024", "MercedesAMG_G63SUVRewardRecycled_2020", "MercedesAMG_G63SUVReward_2020", "MercedesAMG_GT3_2020", 
  "MercedesAMG_GTBlackSeriesRewardRecycled_2020", "MercedesAMG_GTBlackSeriesReward_2020", "MercedesAMG_GTRRewardHalloween_2017", "MercedesAMG_GTRRewardRecycled_2017", "MercedesAMG_GTRReward_2017", 
  "MercedesAMG_GTSF8_2015", "MercedesAMG_GT_2015", "MercedesAMG_S63CoupeRewardRecycled_2020", "MercedesAMG_S63CoupeReward_2020", "MercedesBenz_300SLClassic_1954", 
  "MercedesBenz_A45AMGElite_2014", "MercedesBenz_A45AMG_2014", "MercedesBenz_C63AMGCoupeBlackSeries_2014", "MercedesBenz_C63AMGEdition507_2014", "MercedesBenz_CLA45AMGShootingBrakeBoss_2015", 
  "MercedesBenz_CLKGTR_1999", "MercedesBenz_LBC63AMGCoupeBlackSeries_2014", "MercedesBenz_SL65AMGBlackSeries_2009", "MercedesBenz_SLSAMGBlackSeries_2013", "Mini_CooperJCWGP_2020", 
  "Mini_CooperSElite_2014", "Mini_CooperS_2014", "Mitsubishi_EclipseF1_1995", "Mitsubishi_EclipseSpyderF2_2003", "Mitsubishi_LancerEVOXTNR_2015", 
  "Mitsubishi_LancerEvolutionIXF3_2006", "Mitsubishi_LancerEvolutionVIIF2_2002", "Mitsubishi_VoltexEvoIXRewardRecycled_2005", "Mitsubishi_VoltexEvoIXReward_2005", "Mystery_CarSCS_1234", 
  "Mystery_Car_1234", "Nilu27_NILU_2025", "Nissan_240SXRocketBunnyBossRewardRecycled_1995", "Nissan_240SXRocketBunnyBossReward_1995", "Nissan_350ZF3_2003", 
  "Nissan_350ZRocketBunnyV2Easter_2003", "Nissan_350ZRocketBunnyV2_2003", "Nissan_350ZRocketBunny_2003", "Nissan_ActiveSkylineGTRR33_1995", "Nissan_GTR50RewardRecycled_2020", 
  "Nissan_GTR50Reward_2020", "Nissan_GTR50_2021", "Nissan_GTRNISMOGT3_2015", "Nissan_GTRNISMORewardRecycled_2024", "Nissan_GTRNISMOReward_2024", 
  "Nissan_GTRNismoCrewRecycled_2017", "Nissan_GTRNismoCrew_2017", "Nissan_GTRNismoNRewardRecycled_2017", "Nissan_GTRNismoNReward_2017", "Nissan_GTRPremium_2015", 
  "Nissan_GTRR35BensopraF6_2012", "Nissan_GTRRewardRecycled_2015", "Nissan_GTRReward_2015", "Nissan_GTRTNR_2017", "Nissan_GTR_2017", 
  "Nissan_JukeR20ConceptRewardRecycled_2015", "Nissan_JukeR20ConceptReward_2015", "Nissan_KRCJapanGTRR35RewardRecycled_2017", "Nissan_KRCJapanGTRR35Reward_2017", "Nissan_LBER34Skyline_2002", 
  "Nissan_LBGTRType2_2017", "Nissan_LBSkylineR32_1993", "Nissan_LBSuperSilhouetteSilviaS15_1999", "Nissan_PandeMGTRR33RewardRecycled_1995", "Nissan_PandeMGTRR33Reward_1995", 
  "Nissan_ProtoZ_2020", "Nissan_R390GT1_1997", "Nissan_SilviaS14F1_1997", "Nissan_SilviaS15CrewRecycled_1999", "Nissan_SilviaS15Crew_1999", 
  "Nissan_SilviaS15F3_1999", "Nissan_SilviaS15RocketBunny_1999", "Nissan_SilviaS15TNR_1999", "Nissan_SkylineGTRF4_2002", "Nissan_SkylineGTRR33F1_1995", 
  "Nissan_SkylineGTRR34F2_1999", "Nissan_SkylineGTRR34TNR_2002", "Nissan_SkylineR33NismoSTune_1995", "Nissan_StillenMaximaF1_1999", "Nissan_TopSecret350ZF3_2003", 
  "Nissan_VeilsideZRewardRecycled_2023", "Nissan_VeilsideZReward_2023", "Nissan_ZNISMORewardRecycled_2024", "Nissan_ZNISMOReward_2024", "Nissan_ZTNR_2023", 
  "Nissan_Zero4Skyline2000GT_1971", "Noble_M500_2022", "Noble_M600CarbonSport_2017", "Noble_M600F9_2017", "Noble_M600RewardRecycled_2017", 
  "Noble_M600Reward_2017", "Noble_M600SpeedsterRewardRecycled_2018", "Noble_M600SpeedsterReward_2018", "Pagani_C10RewardRecycled_2023", "Pagani_C10Reward_2023", 
  "Pagani_C10_2023", "Pagani_HuayraBCRewardRecycled_2016", "Pagani_HuayraBCReward_2016", "Pagani_HuayraBCRoadsterLS_2019", "Pagani_HuayraBCRoadsterPB_2019", 
  "Pagani_HuayraBCRoadster_2019", "Pagani_HuayraCodalungaSpeedster_2025", "Pagani_HuayraCodalunga_2022", "Pagani_HuayraElite_2014", "Pagani_HuayraREvo_2024", 
  "Pagani_HuayraR_2021", "Pagani_HuayraRoadsterRewardRecycled_2017", "Pagani_HuayraRoadsterReward_2017", "Pagani_Huayra_2014", "Pagani_ImolaGold_2021", 
  "Pagani_ImolaRoadster_2023", "Pagani_Imola_2021", "Pagani_UtopiaRoadster_2024", "Pagani_ZondaBarchetta_2018", "Pagani_ZondaCinqueCoupeRewardRecycled_2009", 
  "Pagani_ZondaCinqueCoupeReward_2009", "Pagani_ZondaCinqueCoupe_2009", "Pagani_ZondaCinqueRoadsterRewardRecycled_2010", "Pagani_ZondaCinqueRoadsterReward_2010", "Pagani_ZondaCinqueRoadster_2010", 
  "Pagani_ZondaREvoBarchetta_2021", "Pagani_ZondaRevolucion_2013", "Pininfarina_B95_2025", "Pininfarina_BattistaNinoFarina_2023", "Pininfarina_BattistaRewardRecycled_2022", 
  "Pininfarina_BattistaReward_2022", "Pininfarina_Battista_2020", "Placeholder_CoveredCar_1234", "Plymouth_FormulaSBarracudaElite_1968", "Plymouth_FormulaSBarracuda_1968", 
  "Plymouth_FuryJimBelvedere_1958", "Plymouth_HemiCudaClassic_1971", "Plymouth_RidesByKamBarracuda_1970", "Plymouth_RingbrothersCuda_1970", "Plymouth_RoadRunnerGTXF8_1971", 
  "Plymouth_RuffianCoupe_1935", "Plymouth_SuperbirdLPClassic_1970", "Plymouth_WeaverCustomsCudaTorcReward4thJuly_2016", "Plymouth_WeaverCustomsCudaTorcRewardRecycled_2016", "Plymouth_WeaverCustomsCudaTorcReward_2016", 
  "Pontiac_FieroF9_1986", "Pontiac_FirebirdTransAm_1977", "Pontiac_GTOTheJudgeClassic_1969", "Pontiac_HorizonMotorsportsTransAm_1973", "Pontiac_NHRFirebird_1970", 
  "Pontiac_RyansFirebirdTransAm_1978", "Porsche_718BoxsterS_2017", "Porsche_718BoxsterSpyder_2020", "Porsche_718CaymanGT4RS_2022", "Porsche_718CaymanGT4_2020", 
  "Porsche_718SpyderRSRewardRecycled_2024", "Porsche_718SpyderRSReward_2024", "Porsche_911Carrera4SCabrioletRewardRecycled_2020", "Porsche_911Carrera4SCabrioletReward_2020", "Porsche_911CarreraRS27LPClassic_1973", 
  "Porsche_911DakarRewardRecycled_2023", "Porsche_911DakarReward_2023", "Porsche_911GT1StraBenversion_1996", "Porsche_911GT2RSClubSportSalzburg_2019", "Porsche_911GT2RSClubSport_2019", 
  "Porsche_911GT2RSGold_2017", "Porsche_911GT2RSVIP_2017", "Porsche_911GT2RS_2017", "Porsche_911GT2_1993", "Porsche_911GT39922_2025", 
  "Porsche_911GT3R992_2022", "Porsche_911GT3RRennsport_2023", "Porsche_911GT3RS992Tribute_2023", "Porsche_911GT3RS992_2023", "Porsche_911GT3RS997_2012", 
  "Porsche_911GT3RSCrewRecycled_2016", "Porsche_911GT3RSCrew_2016", "Porsche_911GT3RSRewardRecycled_2018", "Porsche_911GT3RSReward_2018", "Porsche_911GT3RewardRecycled_2018", 
  "Porsche_911GT3Reward_2018", "Porsche_911GT3TouringRewardRecycled_2022", "Porsche_911GT3TouringReward_2022", "Porsche_911GT3_2022", "Porsche_911RRewardRecycled_2017", 
  "Porsche_911RReward_2017", "Porsche_911RWBRewardRecycled_1972", "Porsche_911RWBReward_1972", "Porsche_911STRII_1972", "Porsche_911STRewardRecycled_2024", 
  "Porsche_911STReward_2024", "Porsche_911SpeedsterRewardRecycled_2020", "Porsche_911SpeedsterReward_2020", "Porsche_911Targa4GTSRewardRecycled_2025", "Porsche_911Targa4GTSReward_2025", 
  "Porsche_911Targa4SRewardRecycled_2021", "Porsche_911Targa4SReward_2021", "Porsche_911Turbo930LPClassic_1977", "Porsche_911TurboFlachbauC_1987", "Porsche_911TurboSRewardRecycled_2016", 
  "Porsche_911TurboSRewardRecycled_2021", "Porsche_911TurboSRewardRecycled_2026", "Porsche_911TurboSReward_2016", "Porsche_911TurboSReward_2021", "Porsche_911TurboSReward_2026", 
  "Porsche_912Hoonipigasus_1966", "Porsche_917K_1970", "Porsche_918SpyderGold_2015", "Porsche_918SpyderMartini_2015", "Porsche_918SpyderRewardRecycled_2015", 
  "Porsche_918SpyderReward_2015", "Porsche_919Street_2020", "Porsche_935Gold_2019", "Porsche_935Salzburg_2019", "Porsche_935_2019", 
  "Porsche_959_1988", "Porsche_962C_1987", "Porsche_963LMDh_2023", "Porsche_Bisimoto935K3V_1984", "Porsche_Canepa959_1988", 
  "Porsche_CarreraGTClassic_2003", "Porsche_CayenneTurboGTRewardRecycled_2022", "Porsche_CayenneTurboGTReward_2022", "Porsche_CaymanGT4Salzburg_2016", "Porsche_CaymanGT4_2016", 
  "Porsche_DD911GTRSRRewardRecycled_2017", "Porsche_DD911GTRSRReward_2017", "Porsche_Manthey911GT3RSRewardRecycled_2024", "Porsche_Manthey911GT3RSReward_2024", "Porsche_MissionRConcept_2021", 
  "Porsche_PanameraSportTurismoRewardRecycled_2021", "Porsche_PanameraSportTurismoReward_2021", "Porsche_RWB911Turbo_1991", "Porsche_RWB964RewardRecycled_1991", "Porsche_RWB964Reward_1991", 
  "Porsche_RWB993Evo_1993", "Porsche_RWB993RewardRecycled_1993", "Porsche_RWB993Reward_1993", "Porsche_RWB993Rotana_1993", "Porsche_TaycanTurboGTRewardRecycled_2025", 
  "Porsche_TaycanTurboGTReward_2025", "Porsche_TaycanTurboSCrossTurismo_2022", "Porsche_TaycanTurboSPride_2021", "Porsche_TaycanTurboSRewardRecycled_2021", "Porsche_TaycanTurboSReward_2021", 
  "Porsche_VorsteinerGT4VCS_2016", "RAESR_TachyonSpeed_2024", "RAM_1500TRX_2021", "RUF_CTR3EVO_2023", "Radford_Type62GOSH_2021", 
  "Radford_Type62PikesPeak_2023", "Radford_Type62RewardRecycled_2021", "Radford_Type62Reward_2021", "Renault_ClioV6Phase2_2005", "Rimac_NeveraR_2025", 
  "Rimac_NeveraReward_2022", "Rimac_NeveraRewardrecycled_2022", "Rimac_Nevera_2021", "SCG_004CS_2020", "SCG_007_2021", 
  "SCG_SCG003SCarbon_2017", "SCG_SCG003S_2017", "SCG_SCG004CRewardRecycled_2019", "SCG_SCG004CReward_2019", "SSC_TuataraGold_2019", 
  "SSC_TuataraSilver_2019", "SSC_TuataraStriker_2022", "SSC_TuataraWRE_2020", "SSC_Tuatara_2019", "SSC_UltimateAeroTT_2009", 
  "Saleen_S1RewardRecycled_2018", "Saleen_S1Reward_2018", "Saleen_S7Classic_2004", "Shelby_Cobra427SCClassic_1965", "Shelby_CobraDaytonaLP_1964", 
  "Shelby_GT500_1967", "Shelby_MustangSuperSnakeR_2025", "Shelby_SuperSnakeRewardRecycled_2019", "Shelby_SuperSnakeReward_2019", "Shelby_SuperSnakeS650RewardRecycled_2024", 
  "Shelby_SuperSnakeS650Reward_2024", "Spyker_C8PreliatorRewardRecycled_2017", "Spyker_C8PreliatorReward_2017", "Spyker_C8PreliatorSpyder_2017", "Subaru_BRZF8_2013", 
  "Subaru_BRZRocketBunnyVIP_2013", "Subaru_BRZRocketBunny_2013", "Subaru_BRZtSRewardRecycled_2024", "Subaru_BRZtSReward_2024", "Subaru_BRZtSTNR_2020", 
  "Subaru_ImprezaWRXF4_2009", "Subaru_ImprezaWRXSTI_2014", "Subaru_VarisImprezaWRXSTI_2014", "Subaru_VarisWRXSTICALM_2018", "Subaru_WRXSTIF8_2018", 
  "Subaru_WRXSTIGobstopperII_2015", "Subaru_WRXSTITNR_2018", "TVR_CerberaSpeed12_1996", "TVR_GriffithRewardRecycled_2019", "TVR_GriffithReward_2019", 
  "TVR_SagarisRewardRecycled_2006", "TVR_SagarisReward_2006", "TVR_Sagaris_2006", "Toyota_86Boss_2014", "Toyota_86_2014", 
  "Toyota_CamryNASCAR_2022", "Toyota_GR86TNR_2023", "Toyota_GRSupraF9_2020", "Toyota_GRSupraTNR_2020", "Toyota_GRSupraV2TNR_2021", 
  "Toyota_GRSupra_2020", "Toyota_GRYarisRewardRecycled_2021", "Toyota_GRYarisReward_2021", "Toyota_LBGRSupraRewardRecycled_2020", "Toyota_LBGRSupraReward_2020", 
  "Toyota_PandeMGRSupraV15_2020", "Toyota_PandeMGRSupraV1_2020", "Toyota_SprinterTruenoAE86_1980", "Toyota_SupraMK4TNR_1994", "Toyota_SupraMKIVF1_1994", 
  "Toyota_SupraMKIVF7_1995", "Toyota_SupraMKIVVaris_1994", "Ultima_EVOCoupeRewardRecycled_2016", "Ultima_EVOCoupeReward_2016", "Ultima_EVOCoupeSupercharged_2016", 
  "Ultima_RSGold_2020", "Ultima_RS_2020", "VUHL_05RRRewardRecycled_2019", "VUHL_05RRReward_2019", "Volkswagen_GolfGTICrewRecycled_1982", 
  "Volkswagen_GolfGTICrew_1982", "Volkswagen_GolfGTIElite_2014", "Volkswagen_GolfGTI_2014", "Volkswagen_IDR_2019", "Volkswagen_JettaF1_1995", 
  "Volkswagen_RocketBunnyGolfGTI_2014", "Volkswagen_SciroccoR_2015", "WMotors_FenyrSupersportRewardRecycled_2016", "WMotors_FenyrSupersportReward_2016", "WMotors_LykanHyperSportRewardRecycled_2015", 
  "WMotors_LykanHyperSportReward_2015", "Zenvo_AuroraAgil_2024", "Zenvo_AuroraTurRewardRecycled_2024", "Zenvo_AuroraTurReward_2024", "Zenvo_AuroraTur_2024", 
  "Zenvo_TS1GTRewardRecycled_2018", "Zenvo_TS1GTReward_2018", "Zenvo_TS1GT_2018", "Zenvo_TSRGTRewardRecycled_2023", "Zenvo_TSRGTReward_2023", 
  "Zenvo_TSRSGold_2020", "Zenvo_TSRS_2019", "Zenvo_TSRS_2020"
];

const ALL_BRANDS = Array.from(new Set(ALL_CAR_IDS.map(crdb => `id_${crdb.split('_')[0].toLowerCase()}`))).sort();

// ==========================================
// CORE LOGIC
// ==========================================
const DEFAULT_INBOX_SETTINGS = {
  cash: 1000000, gold: 1000, bronzeKeys: 10, silverKeys: 10, goldKeys: 10, fuel: 20,
  stage6: 0, restorationParts: 0, wildcardTokens: 0, crewRP: 0, tickets: 0,
  jokerStage6: 0, jokerRestoration: 0, stickers: 0, banners: 0,
  eliteTokens: 100, carCredits: 1000,
};

function extractJsonObject(text: string) {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) return text.substring(start, end + 1);
  return text;
}

function unpackNsb(arrayBuffer: ArrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  if (bytes[0] !== 0x1f || bytes[1] !== 0x8b) {
    const text = new TextDecoder().decode(bytes);
    return { jsonText: extractJsonObject(text), version: 0, trailing: new Uint8Array(0) };
  }
  const inflator = new pako.Inflate();
  inflator.push(bytes);
  if (inflator.err) throw new Error("GZIP Error: " + inflator.msg);

  const text = new TextDecoder().decode(inflator.result as Uint8Array);
  const trailingStart = bytes.length - inflator.strm.avail_in;
  const trailing = bytes.slice(trailingStart);

  let version = 1;
  let jsonText = text;
  const lines = text.split('\n');
  if (lines.length >= 2 && lines[0].includes('-ver-')) {
    const parts = lines[0].split('-ver-');
    if (parts.length > 1) {
      const v = parseInt(parts[0]);
      if (!isNaN(v)) version = v;
    }
    jsonText = text.substring(lines[0].length + 1);
  }
  return { jsonText: extractJsonObject(jsonText), version, trailing };
}

async function generateCurrentKey(playerId: string, version: number) {
  const reversedId = playerId.split('').reverse().join('');
  const idx = version % reversedId.length;
  const rotated = reversedId.slice(idx) + reversedId.slice(0, idx);
  return new TextEncoder().encode(rotated);
}

async function packNsb(jsonText: string, playerId: string, version: number, trailing: Uint8Array) {
  const encoder = new TextEncoder();
  const jsonBytes = encoder.encode(jsonText);
  const key = await generateCurrentKey(playerId, version);

  const cryptoKey = await window.crypto.subtle.importKey(
    "raw", key, { name: "HMAC", hash: "SHA-1" }, false, ["sign"]
  );
  const signatureBuffer = await window.crypto.subtle.sign("HMAC", cryptoKey, jsonBytes);
  const signatureHex = Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  const fullText = `${version}-ver-${signatureHex}\n${jsonText}`;
  const fullBytes = encoder.encode(fullText);
  const gzipped = pako.gzip(fullBytes);

  const result = new Uint8Array(gzipped.length + trailing.length);
  result.set(gzipped, 0);
  result.set(trailing, gzipped.length);
  return result;
}

// ==========================================
// CAR TEMPLATE GENERATOR
// ==========================================
function generateCarTemplate(crdb: string, maxed: boolean, unid: number) {
  const upgradeLevel = maxed ? 7 : 0;
  const fusionLevel = maxed ? 7 : 0;
  const fusionSlots = maxed ? [7, 7, 7, 7, 7] : [0, 0, 0, 0, 0];
  
  const generateUpgradeState = () => {
    const lvls = [];
    for (let i = 0; i < 7; i++) {
      lvls.push({
        ulpf: maxed ? true : (i === 0),
        fsg: fusionSlots
      });
    }
    return { lvlo: upgradeLevel, lvlf: fusionLevel, lvls };
  };

  return {
    "unid": unid,
    "crdb": crdb,
    "awar": false,
    "grsp": [0, 0, 0, 0, 0],
    "fidr": 0, "nlpr": 0, "tafr": 0, "titp": 0, "trld": 0.0, "tssp": 0, "tssr": 0, "ttup": 0, "ttpp": 0,
    "appi": 0, "orpi": 0, "apiid": 0, "oriid": 0, "apcid": 0, "orcid": 0,
    "apnid": -2147483648, "apnzid": -2147483648, "apncf": -2147483648, "apncb": -2147483648, "apfid": -2147483648,
    "apcns": 0, "appns": 0, "apnpid": -2147483648, "opnid": -2147483648, "opnzid": -2147483648, "opncf": -2147483648,
    "opncb": -2147483648, "opfid": -2147483648, "opcns": 0, "oppns": 0, "opnpid": -2147483648, "aplid": -2147483648,
    "orlid": -2147483648, "aplzsid": -2147483648, "orlzsid": -2147483648, "apln": "",
    "apcn": [`${crdb}_Wheel1A_3D`], "opcn": `${crdb}_Wheel1A_3D`,
    "bqmt": 0.0, "bhmt": 0.0, "ditr": 0.0, "rcat": 0, "rwon": 0, "msou": 0, "nuub": 0, "ccna": 0,
    "upst": Array(7).fill(null).map(() => generateUpgradeState()),
    "fpin": 1,
    "rpst": [{"rvlo": 0, "rvlf": 0}, {"rvlo": 0, "rvlf": 0}, {"rvlo": 0, "rvlf": 0}, {"rvlo": 0, "rvlf": 0}],
    "tscs": {"BODYKIT": 0, "WHEELS": 0, "WING": 0, "BOOST_COLOR": 0, "HOOD": 0, "RIMS": 0, "TIRE": 0},
    "fpul": 0, "rsup": 0, "rpbb": 0, "rncu": false, "fcu": false, "pncu": false, "cncu": false,
    "cppi": 0, "cepi": 0, "tdut": 0, "tdtt": 0, "ttqm": 0, "tthm": 0, "tt60": 0, "tt1h": 0, "spqm": 0, "sphm": 0,
    "ctie": "TIER_1", "csrc": "Gacha", "nupl": {"txt": "", "cpf": false}, "esup": false, "elcl": 0, "gacp": false,
    "paid": 0, "wpid": 2147483647, "inid": 0, "caid": 0, "lzsid": -2147483648, "livid": -2147483648,
    "whbn": "Wheel1A_3D", "tlad": 0.0, "need": false, "cmlv": 0, "isra": false
  };
}

// ==========================================
// COMPONENT
// ==========================================

export function NsbBench() {
  const [nsbFile, setNsbFile] = useState<File | null>(null);
  const [scbFile, setScbFile] = useState<File | null>(null);

  const [playerId, setPlayerId] = useState("");
  const [saveMode, setSaveMode] = useState<'merge' | 'replace'>('merge');

  // Emulator vs Phone toggle
  const [platform, setPlatform] = useState<'emulator' | 'phone'>('emulator');
  const [emulator, setEmulator] = useState<'gpgde' | 'ldplayer' | 'bluestacks' | 'mumu'>('gpgde');
  
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // ---- God Inbox access state (AUTH REMOVED FOR LOCAL RELEASE) ----
  // Force unlocked so the UI renders immediately without a password
  const [isInboxUnlocked, setIsInboxUnlocked] = useState(true);
  const [accessCode, setAccessCode] = useState("");
  const [codeError, setCodeError] = useState("");
  // Removed: unlockToken, licenseToken, isMasterSession (no longer needed)

  const [enableInbox, setEnableInbox] = useState(false);
  const [inboxSettings, setInboxSettings] = useState(DEFAULT_INBOX_SETTINGS);

  const [basicCash, setBasicCash] = useState(0);
  const [basicGold, setBasicGold] = useState(0);
  const [basicBronze, setBasicBronze] = useState(0);
  const [basicSilver, setBasicSilver] = useState(0);
  const [basicGoldKeys, setBasicGoldKeys] = useState(0);
  
  const rewardTypes = {
    cash: 1, gold: 2, bronzeKeys: 7, silverKeys: 8, goldKeys: 9, fuel: 10, 
    cars_stock: 11, cars_maxed: 20,
    stage6: 12, fusions: 13, restorationParts: 22, wildcardTokens: 19,
    crewRP: 18, tickets: 35, jokerFusions: 38, jokerStage6: 40, jokerRestoration: 39,
    stickers: 44, banners: 45, eliteTokens: 24, carCredits: 47
  };

  const [carMode, setCarMode] = useState<'all' | 'select' | 'none'>('select');
  const [carDeliveryType, setCarDeliveryType] = useState<'stock' | 'maxed'>('stock');
  const [selectedCars, setSelectedCars] = useState<string[]>([]);
  const [carSearch, setCarSearch] = useState("");
  const [injectAssociatedFusions, setInjectAssociatedFusions] = useState(false);

  const [injectCars, setInjectCars] = useState(false);
  const [directCarMode, setDirectCarMode] = useState<'all' | 'select'>('all');
  const [directCarDeliveryType, setDirectCarDeliveryType] = useState<'stock' | 'maxed'>('stock');
  const [directSelectedCars, setDirectSelectedCars] = useState<string[]>([]);
  const [directCarSearch, setDirectCarSearch] = useState("");

  // Obfuscated dummy function replacing the old backend check
  const handleRedeemCode = async () => {
    setCodeError("");
    setIsInboxUnlocked(true);
  };

      const handleGenerate = async () => {
    if (!playerId.trim()) return setError("Enter your Player ID");
    if (!nsbFile || !scbFile) return setError("Upload NSB and SCB");

    setError("");
    setIsLoading(true);

    try {
      setStatus("Unpacking NSB...");
      const nsbBuffer = await nsbFile.arrayBuffer();
      
      // FIXED: Parsing error resolved by avoiding destructuring with colons
      const unpackedNsb = unpackNsb(nsbBuffer);
      const nsbJsonStr = unpackedNsb.jsonText;
      const nsbVer = unpackedNsb.version;
      const nsbTrail = unpackedNsb.trailing;
      
      const nsb = JSON.parse(nsbJsonStr);

      setStatus("Unpacking SCB...");
      const scbBuffer = await scbFile.arrayBuffer();
      const unpackedScb = unpackNsb(scbBuffer);
      const scbJsonStr = unpackedScb.jsonText;
      const scbVer = unpackedScb.version;
      
      const scb = JSON.parse(scbJsonStr);

      if (basicCash > 0) { nsb.caea = basicCash; nsb.casp = 0; scb.CashEarned = nsb.caea; scb.CashSpent = 0; }
      if (basicGold > 0) { nsb.goea = basicGold; nsb.gosp = 0; scb.GoldEarned = nsb.goea; scb.GoldSpent = 0; }
      if (basicBronze > 0) { scb.BronzeKeys = basicBronze; }
      if (basicSilver > 0) { scb.SilverKeys = basicSilver; }
      if (basicGoldKeys > 0) { scb.GoldKeys = basicGoldKeys; }

      if (injectCars) {
        const carsToInject = directCarMode === 'all' ? ALL_CAR_IDS : directSelectedCars;

        if (saveMode === 'replace' || !nsb.garage) nsb.garage = [];

        let maxUnid = 1000;
        if (nsb.garage) {
          nsb.garage.forEach((car: any) => {
            if (car.unid > maxUnid) maxUnid = car.unid;
          });
        }

        carsToInject.forEach(crdb => {
          const exists = nsb.garage.some((c: any) => c.crdb === crdb);
          if (saveMode === 'merge' && exists) return;

          maxUnid++;
          const newCar = generateCarTemplate(crdb, directCarDeliveryType === 'maxed', maxUnid);
          nsb.garage.push(newCar);
        });
      }

      if (enableInbox) {
        if (!nsb.playinbitms) nsb.playinbitms = [];
        if (!nsb.picl) nsb.picl = [];

        const generateReward = (type: number, name: string, pType: number, pGrade: number, amount: number) => ({
          reason: "TEXT_TAG_CS_COMPENSATION",
          ttl: 0,
          id: `inbox_${Math.random().toString(36).substring(2, 10)}`,
          rank: 0,
          CSR2ApplyableReward: {
            rewardType: type, name: name, partType: pType, partGrade: pGrade,
            gachaConfig: -1, amount: amount, ConsumableBoostId: ""
          }
        });

        const newRewards = [];

        if (inboxSettings.cash > 0) newRewards.push(generateReward(rewardTypes.cash, "", 0, 0, inboxSettings.cash));
        if (inboxSettings.gold > 0) newRewards.push(generateReward(rewardTypes.gold, "", 0, 0, inboxSettings.gold));
        if (inboxSettings.bronzeKeys > 0) newRewards.push(generateReward(rewardTypes.bronzeKeys, "", 0, 0, inboxSettings.bronzeKeys));
        if (inboxSettings.silverKeys > 0) newRewards.push(generateReward(rewardTypes.silverKeys, "", 0, 0, inboxSettings.silverKeys));
        if (inboxSettings.goldKeys > 0) newRewards.push(generateReward(rewardTypes.goldKeys, "", 0, 0, inboxSettings.goldKeys));
        if (inboxSettings.fuel > 0) newRewards.push(generateReward(rewardTypes.fuel, "", 0, 0, inboxSettings.fuel));
        if (inboxSettings.wildcardTokens > 0) newRewards.push(generateReward(rewardTypes.wildcardTokens, "", 0, 0, inboxSettings.wildcardTokens));
        if (inboxSettings.crewRP > 0) newRewards.push(generateReward(rewardTypes.crewRP, "", 0, 0, inboxSettings.crewRP));
        if (inboxSettings.tickets > 0) newRewards.push(generateReward(rewardTypes.tickets, "", 0, 0, inboxSettings.tickets));
        if (inboxSettings.eliteTokens > 0) {
          for (let pt = 0; pt < 4; pt++) {
            for (let pg = 1; pg <= 4; pg++) {
              newRewards.push(generateReward(rewardTypes.eliteTokens, "", pt, pg, inboxSettings.eliteTokens));
            }
          }
        }
        if (inboxSettings.carCredits > 0) newRewards.push(generateReward(rewardTypes.carCredits, "", 0, 0, inboxSettings.carCredits));
        if (inboxSettings.stickers > 0) newRewards.push(generateReward(rewardTypes.stickers, "", 0, 0, inboxSettings.stickers));
        if (inboxSettings.banners > 0) newRewards.push(generateReward(rewardTypes.banners, "", 0, 0, inboxSettings.banners));

        if (injectAssociatedFusions) {
          let brandsToInject: string[] = [];
          if (carMode === 'all') {
            brandsToInject = ALL_BRANDS;
          } else if (carMode === 'select') {
            const selectedBrands = new Set<string>();
            selectedCars.forEach(crdb => {
              const brand = crdb.split('_')[0].toLowerCase();
              selectedBrands.add(`id_${brand}`);
            });
            brandsToInject = Array.from(selectedBrands);
          }

          brandsToInject.forEach(brand => {
            for (let pType = 0; pType <= 6; pType++) {
              for (let pGrade = 1; pGrade <= 3; pGrade++) {
                newRewards.push(generateReward(rewardTypes.fusions, brand, pType, pGrade, 10000));
                newRewards.push(generateReward(rewardTypes.jokerFusions, brand, pType, pGrade, 10000));
              }
            }
          });
        }

        if (carMode !== 'none' || inboxSettings.stage6 > 0 || inboxSettings.jokerStage6 > 0) {
          const carRewardType = carDeliveryType === 'maxed' ? rewardTypes.cars_maxed : rewardTypes.cars_stock;

          if (carMode === 'all') {
            ALL_CAR_IDS.forEach(crdb => newRewards.push(generateReward(carRewardType, crdb, 0, 0, 1)));
          } else if (carMode === 'select') {
            selectedCars.forEach(crdb => newRewards.push(generateReward(carRewardType, crdb, 0, 0, 1)));
          }

          const stage6Targets = carMode === 'all' ? ALL_CAR_IDS : (carMode === 'select' ? selectedCars : []);

          const stage6Amount = Math.min(10, Math.max(0, inboxSettings.stage6 || 0));
          const jokerStage6Amount = Math.min(10, Math.max(0, inboxSettings.jokerStage6 || 0));

          if ((stage6Amount > 0 || jokerStage6Amount > 0) && stage6Targets.length > 0) {
            stage6Targets.forEach(crdb => {
              for (let pType = 0; pType <= 6; pType++) {
                if (stage6Amount > 0) {
                  newRewards.push(generateReward(rewardTypes.stage6, crdb, pType, 0, stage6Amount));
                }
                if (jokerStage6Amount > 0) {
                  newRewards.push(generateReward(rewardTypes.jokerStage6, crdb, pType, 0, jokerStage6Amount));
                }
              }
            });
          }

          if (inboxSettings.restorationParts > 0) newRewards.push(generateReward(rewardTypes.restorationParts, "", 0, 0, inboxSettings.restorationParts));
          if (inboxSettings.jokerRestoration > 0) newRewards.push(generateReward(rewardTypes.jokerRestoration, "", 0, 0, inboxSettings.jokerRestoration));
        }

        nsb.playinbitms.push(...newRewards);
        nsb.picl.push(...Array(newRewards.length).fill("eRewards"));
      }

      setStatus("Packing Files...");
      const newNsbBytes = await packNsb(JSON.stringify(nsb), playerId.trim(), nsbVer, nsbTrail);
      const newScbBytes = await packNsb(JSON.stringify(scb), playerId.trim(), scbVer, new Uint8Array(0));

      const nsbBlob = new Blob([newNsbBytes], { type: "application/octet-stream" });
      const scbBlob = new Blob([newScbBytes], { type: "application/octet-stream" });

      const a1 = document.createElement("a");
      a1.href = URL.createObjectURL(nsbBlob);
      a1.download = "nsb_modded";
      a1.click();

      setTimeout(() => {
        const a2 = document.createElement("a");
        a2.href = URL.createObjectURL(scbBlob);
        a2.download = "scb_modded";
        a2.click();
      }, 500);

      setStatus("Files generated successfully! Ready for True Maverick.");
    } catch (err) {
      setError((err as Error).message || String(err));
      setStatus("");
    }
    setIsLoading(false);
  };

  // ==========================================
  // SCRIPTS (Dynamic based on emulator selection)
  // ==========================================
  const getAdbPath = () => {
    switch(emulator) {
      case 'gpgde': return 'C:\\Program Files\\Google\\Play Games Developer Emulator\\current\\emulator\\adb.exe';
      case 'ldplayer': return 'C:\\LDPlayer\\LDPlayer9\\adb.exe';
      case 'bluestacks': return 'C:\\Program Files\\BlueStacks_nxt\\HD-Adb.exe';
      case 'mumu': return 'C:\\Program Files\\Netease\\MuMuPlayer-12.0\\shell\\adb.exe';
      default: return 'adb';
    }
  };

  const getPullScript = () => {
    const adbPath = getAdbPath();
    const isLdPlayer = emulator === 'ldplayer';
    
    const connectCmd = isLdPlayer ? `& $adb connect 127.0.0.1:5555\nStart-Sleep -Seconds 1` : ``;
    const target = isLdPlayer ? `-s 127.0.0.1:5555` : ``;

    return `$adb = "${adbPath}"
$pkg = "com.naturalmotion.customstreetracer2"
$ext = "/sdcard/Android/data/$pkg/files"
$dest = "$env:USERPROFILE\\Downloads"

Write-Host "0. Connecting to Emulator..." -ForegroundColor Cyan
${connectCmd}

Write-Host "1. Force stopping game..." -ForegroundColor Cyan
& $adb ${target} shell "am force-stop $pkg"

Write-Host "2. Finding active 11-digit ID..." -ForegroundColor Cyan
$dirs = & $adb ${target} shell "ls $ext/pp"
$id = ($dirs | Where-Object { $_ -match '^\\d{11}$' } | Select-Object -First 1).Trim()

if (-not $id) {
    Write-Host "Could not find player ID folder! Is the game installed and opened at least once?" -ForegroundColor Red
    exit
}

Write-Host "3. Pulling files from ID: $id" -ForegroundColor Yellow
& $adb ${target} pull "$ext/pp/$id/nsb" "$dest\\nsb_original"
& $adb ${target} pull "$ext/pp/$id/scb" "$dest\\scb_original"

Write-Host "Done! nsb_original and scb_original are now in your Downloads folder." -ForegroundColor Green`;
  };

  const getInjectScript = () => {
    const adbPath = getAdbPath();
    const isLdPlayer = emulator === 'ldplayer';
    
    const rootCmd = isLdPlayer 
      ? `& $adb connect 127.0.0.1:5555\n& $adb -s 127.0.0.1:5555 root\nStart-Sleep -Seconds 2\n& $adb -s 127.0.0.1:5555 wait-for-device` 
      : `& $adb root\nStart-Sleep -Seconds 2\n& $adb wait-for-device`;
    
    const target = isLdPlayer ? `-s 127.0.0.1:5555` : ``;

    return `$adb = "${adbPath}"
$pkg = "com.naturalmotion.customstreetracer2"
$ext = "/sdcard/Android/data/$pkg/files"
$src = "$env:USERPROFILE\\Downloads"

Write-Host "0. Connecting and enabling root..." -ForegroundColor Cyan
${rootCmd}

Write-Host "1. Force-stopping CSR2..." -ForegroundColor Cyan
& $adb ${target} shell "am force-stop $pkg"

Write-Host "2. Pushing modded NSB and SCB to staging..." -ForegroundColor Cyan
& $adb ${target} push "$src\\nsb_modded" /sdcard/nsb_new
& $adb ${target} push "$src\\scb_modded" /sdcard/scb_new

Write-Host "3. THE TRUE MAVERICK WIPE (pm clear)..." -ForegroundColor Yellow
& $adb ${target} shell "pm clear $pkg"
Start-Sleep -Seconds 3

Write-Host "4. Recreating temp folders and injecting..." -ForegroundColor Yellow
& $adb ${target} shell "mkdir -p $ext/pp/temp"
& $adb ${target} shell "mkdir -p $ext/temp"

& $adb ${target} shell "cp /sdcard/nsb_new $ext/pp/temp/nsb"
& $adb ${target} shell "cp /sdcard/scb_new $ext/pp/temp/scb"

& $adb ${target} shell "cp /sdcard/nsb_new $ext/temp/nsb"
& $adb ${target} shell "cp /sdcard/scb_new $ext/temp/scb"

Write-Host "5. Fixing permissions..." -ForegroundColor Cyan
& $adb ${target} shell "chmod -R 777 $ext"
& $adb ${target} shell "restorecon -RF $ext"
& $adb ${target} shell "rm /sdcard/nsb_new /sdcard/scb_new"

Write-Host "6. Launching CSR2..." -ForegroundColor Green
& $adb ${target} shell "monkey -p $pkg -c android.intent.category.LAUNCHER 1"`;
  };

  const phonePcPullScript = `$adb = "adb"
$d = "-d"
$pkg = "com.naturalmotion.customstreetracer2"
$ext = "/sdcard/Android/data/$pkg/files"
$dest = "$env:USERPROFILE\\Downloads"

Write-Host "Waiting for phone..." -ForegroundColor Cyan
& $adb $d wait-for-device

Write-Host "Force stopping game..." -ForegroundColor Cyan
& $adb $d shell "am force-stop $pkg"

Write-Host "Finding active ID (approve the root prompt on your phone if it appears)..." -ForegroundColor Cyan
$dirs = & $adb $d shell "su -c 'ls $ext/pp'"
$id = ($dirs | Where-Object { $_ -match '^\\d{11}$' } | Select-Object -First 1).Trim()

if (-not $id) {
    Write-Host "Could not find player ID folder! Is the game installed, opened once, and is root granted to the adb shell?" -ForegroundColor Red
    exit
}

Write-Host "Pulling files from ID: $id" -ForegroundColor Yellow
& $adb $d shell "su -c 'cp $ext/pp/$id/nsb /sdcard/nsb_current'"
& $adb $d shell "su -c 'cp $ext/pp/$id/scb /sdcard/scb_current'"
& $adb $d pull /sdcard/nsb_current "$dest\\nsb_original"
& $adb $d pull /sdcard/scb_current "$dest\\scb_original"
& $adb $d shell "rm /sdcard/nsb_current /sdcard/scb_current"

Write-Host "Done! nsb_original and scb_original are now in your Downloads folder." -ForegroundColor Green`;

  const phonePcInjectScript = `$adb = "adb"
$d = "-d"
$pkg = "com.naturalmotion.customstreetracer2"
$ext = "/sdcard/Android/data/$pkg/files"
$src = "$env:USERPROFILE\\Downloads"

Write-Host "Waiting for phone..." -ForegroundColor Cyan
& $adb $d wait-for-device

Write-Host "1. Force-stopping CSR2..." -ForegroundColor Cyan
& $adb $d shell "am force-stop $pkg"

Write-Host "2. Pushing modded NSB and SCB to staging..." -ForegroundColor Cyan
& $adb $d push "$src\\nsb_modded" /sdcard/nsb_new
& $adb $d push "$src\\scb_modded" /sdcard/scb_new

Write-Host "3. THE TRUE MAVERICK WIPE (pm clear)..." -ForegroundColor Yellow
& $adb $d shell "su -c 'pm clear $pkg'"
Start-Sleep -Seconds 3

Write-Host "4. Recreating temp folders and injecting..." -ForegroundColor Yellow
& $adb $d shell "su -c 'mkdir -p $ext/pp/temp'"
& $adb $d shell "su -c 'mkdir -p $ext/temp'"

& $adb $d shell "su -c 'cp /sdcard/nsb_new $ext/pp/temp/nsb'"
& $adb $d shell "su -c 'cp /sdcard/scb_new $ext/pp/temp/scb'"

& $adb $d shell "su -c 'cp /sdcard/nsb_new $ext/temp/nsb'"
& $adb $d shell "su -c 'cp /sdcard/scb_new $ext/temp/scb'"

Write-Host "5. Fixing permissions..." -ForegroundColor Cyan
& $adb $d shell "su -c 'chmod -R 777 $ext'"
& $adb $d shell "su -c 'restorecon -RF $ext'"
& $adb $d shell "rm /sdcard/nsb_new /sdcard/scb_new"

Write-Host "6. Launching CSR2..." -ForegroundColor Green
& $adb $d shell "monkey -p $pkg -c android.intent.category.LAUNCHER 1"`;

  const phoneTermuxPullScript = `pkg="com.naturalmotion.customstreetracer2"
ext="/sdcard/Android/data/$pkg/files"

echo "Force stopping game..."
su -c "am force-stop $pkg"

echo "Finding active ID..."
id=$(su -c "ls $ext/pp" | tr -d '\\r' | grep -E '^[0-9]{11}$' | head -n 1)

if [ -z "$id" ]; then
    echo "Could not find player ID folder! Is the game installed and opened at least once?"
    exit 1
fi

echo "Pulling files from ID: $id"
su -c "cp $ext/pp/$id/nsb /sdcard/Download/nsb_original"
su -c "cp $ext/pp/$id/scb /sdcard/Download/scb_original"

echo "Done! nsb_original and scb_original are now in your Download folder."`;

  const phoneTermuxInjectScript = `pkg="com.naturalmotion.customstreetracer2"
ext="/sdcard/Android/data/$pkg/files"

echo "1. Force-stopping CSR2..."
su -c "am force-stop $pkg"

echo "2. Copying modded NSB and SCB to staging..."
su -c "cp /sdcard/Download/nsb_modded /sdcard/nsb_new"
su -c "cp /sdcard/Download/scb_modded /sdcard/scb_new"

echo "3. THE TRUE MAVERICK WIPE (pm clear)..."
su -c "pm clear $pkg"
sleep 3

echo "4. Recreating temp folders and injecting..."
su -c "mkdir -p $ext/pp/temp"
su -c "mkdir -p $ext/temp"

su -c "cp /sdcard/nsb_new $ext/pp/temp/nsb"
su -c "cp /sdcard/scb_new $ext/pp/temp/scb"

su -c "cp /sdcard/nsb_new $ext/temp/nsb"
su -c "cp /sdcard/scb_new $ext/temp/scb"

echo "5. Fixing permissions..."
su -c "chmod -R 777 $ext"
su -c "restorecon -RF $ext"
su -c "rm /sdcard/nsb_new /sdcard/scb_new"

echo "6. Launching CSR2..."
su -c "monkey -p $pkg -c android.intent.category.LAUNCHER 1"`;

  const renderScript = (title: string, script: string, small = false) => (
    <div className="flex flex-col gap-2 bg-surface rounded border border-border p-3">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-bold text-fg">{title}</span>
        <button
          onClick={() => navigator.clipboard.writeText(script)}
          className="text-xs bg-surface-2 hover:bg-surface-3 px-3 py-1 rounded border border-border transition"
        >
          Copy Script
        </button>
      </div>
      <pre className={`bg-[#1a1a1a] p-3 rounded-lg border border-border overflow-x-auto ${small ? 'text-[10px]' : 'text-xs'} text-gray-300 font-mono`}>
        {script}
      </pre>
    </div>
  );

  return (
    <div className="mx-auto max-w-4xl p-6 flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-fg font-display uppercase tracking-wide">CSR2 NSB Editor</h1>
          <p className="text-sm text-muted mt-1">Generate modded NSB and SCB files. Inject cars, cash, gold, and parts.</p>
        </div>
      </div>

      <div className="border-2 border-red-500/50 bg-red-500/10 p-4 rounded-lg flex gap-3 items-start">
        <span className="text-red-500 text-2xl font-bold mt-[-2px]">⚠️</span>
        <div className="flex flex-col gap-1">
          <h2 className="text-red-500 font-bold uppercase tracking-wide text-sm">Highly Recommended: Read Before Proceeding</h2>
          <p className="text-sm text-fg/80 leading-relaxed">
            Before using the tool, or touching anything, make sure you do not have a banned account. This tool will not unban you, and we do not support unbanning tricks. Start a new tutorial on a fresh Google account before modifying anything. Make sure you complete it until you are in the garage and can access everything without forced tutorials. <strong>Use at your own risk.</strong> Cheating carries inherent risks, and the developer is not liable for any account bans.
          </p>
        </div>
      </div>

      <section className="flex flex-col gap-4 bg-surface p-4 rounded-lg border border-border">
        <div className="flex gap-4">
          <button
            onClick={() => setPlatform('emulator')}
            className={`flex-1 p-4 rounded-md border text-left transition ${platform === 'emulator' ? 'border-primary bg-primary/10' : 'border-border bg-surface-2 hover:border-primary/50'}`}
          >
            <h3 className={`font-bold ${platform === 'emulator' ? 'text-primary' : 'text-fg'}`}>Emulator</h3>
            <p className="text-xs text-muted mt-1">Google Play Games, LDPlayer, BlueStacks, MuMu.</p>
          </button>
          <button
            onClick={() => setPlatform('phone')}
            className={`flex-1 p-4 rounded-md border text-left transition ${platform === 'phone' ? 'border-primary bg-primary/10' : 'border-border bg-surface-2 hover:border-primary/50'}`}
          >
            <h3 className={`font-bold ${platform === 'phone' ? 'text-primary' : 'text-fg'}`}>Rooted Phone</h3>
            <p className="text-xs text-muted mt-1">With a PC (USB) or directly on-device (Termux).</p>
          </button>
        </div>
      </section>

      <section className="flex flex-col gap-4 bg-surface p-4 rounded-lg border border-border">
        <div className="flex gap-4">
          <button
            onClick={() => setSaveMode('merge')}
            className={`flex-1 p-4 rounded-md border text-left transition ${saveMode === 'merge' ? 'border-primary bg-primary/10' : 'border-border bg-surface-2 hover:border-primary/50'}`}
          >
            <h3 className={`font-bold ${saveMode === 'merge' ? 'text-primary' : 'text-fg'}`}>Enhance Existing Save</h3>
            <p className="text-xs text-muted mt-1">Preserves your current cars and progress.</p>
          </button>
          <button
            onClick={() => setSaveMode('replace')}
            className={`flex-1 p-4 rounded-md border text-left transition ${saveMode === 'replace' ? 'border-primary bg-primary/10' : 'border-border bg-surface-2 hover:border-primary/50'}`}
          >
            <h3 className={`font-bold ${saveMode === 'replace' ? 'text-primary' : 'text-fg'}`}>Create Fresh Modded Save</h3>
            <p className="text-xs text-muted mt-1">Wipes the garage and injects only what you select.</p>
          </button>
        </div>
      </section>

      <section className="flex flex-col gap-3 bg-surface p-4 rounded-lg border border-border">
        <label className="text-sm font-bold text-fg">Player ID</label>
        <input
          type="text"
          value={playerId}
          onChange={(e) => setPlayerId(e.target.value)}
          placeholder="e.g. 12345678901"
          className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm font-mono text-fg focus:outline-none focus:border-primary"
        />
      </section>

      <section className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-fg border-b border-border pb-2">1. Upload Current Files</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-muted mb-1">NSB File</label>
            <input type="file" onChange={(e) => setNsbFile(e.target.files?.[0] || null)} className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm text-fg file:mr-4 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-fg hover:file:bg-primary/80" />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">SCB File</label>
            <input type="file" onChange={(e) => setScbFile(e.target.files?.[0] || null)} className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm text-fg file:mr-4 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-fg hover:file:bg-primary/80" />
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4 border-t border-border pt-4">
        <h3 className="text-sm font-semibold text-fg border-b border-border pb-2">2. Basic Resources</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 bg-surface-2 p-4 rounded-lg border border-border">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted">Cash</label>
            <input
              type="number"
              value={basicCash || ''}
              onChange={(e) => setBasicCash(parseInt(e.target.value) || 0)}
              placeholder="0"
              className="w-full rounded-md border border-border bg-surface px-2 py-1 text-sm text-fg focus:border-primary focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted">Gold</label>
            <input
              type="number"
              value={basicGold || ''}
              onChange={(e) => setBasicGold(parseInt(e.target.value) || 0)}
              placeholder="0"
              className="w-full rounded-md border border-border bg-surface px-2 py-1 text-sm text-fg focus:border-primary focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted">Bronze Keys</label>
            <input
              type="number"
              value={basicBronze || ''}
              onChange={(e) => setBasicBronze(parseInt(e.target.value) || 0)}
              placeholder="0"
              className="w-full rounded-md border border-border bg-surface px-2 py-1 text-sm text-fg focus:border-primary focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted">Silver Keys</label>
            <input
              type="number"
              value={basicSilver || ''}
              onChange={(e) => setBasicSilver(parseInt(e.target.value) || 0)}
              placeholder="0"
              className="w-full rounded-md border border-border bg-surface px-2 py-1 text-sm text-fg focus:border-primary focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted">Gold Keys</label>
            <input
              type="number"
              value={basicGoldKeys || ''}
              onChange={(e) => setBasicGoldKeys(parseInt(e.target.value) || 0)}
              placeholder="0"
              className="w-full rounded-md border border-border bg-surface px-2 py-1 text-sm text-fg focus:border-primary focus:outline-none"
            />
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4 border-t border-border pt-4">
        <h3 className="text-sm font-semibold text-fg border-b border-border pb-2">3. Direct Garage Injection</h3>

        <div className="flex items-center gap-2 mb-2">
          <input type="checkbox" checked={injectCars} onChange={(e) => setInjectCars(e.target.checked)} className="w-4 h-4 accent-primary" />
          <label className="text-sm font-medium text-fg">
            Click this box to add cars
          </label>
        </div>

        {injectCars && (
          <div className="bg-surface-2 p-4 rounded-lg border border-border flex flex-col gap-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex gap-4">
                <label className="flex items-center gap-1 text-xs text-muted cursor-pointer">
                  <input type="radio" checked={directCarMode === 'all'} onChange={() => setDirectCarMode('all')} className="accent-primary" /> All Cars
                </label>
                <label className="flex items-center gap-1 text-xs text-muted cursor-pointer">
                  <input type="radio" checked={directCarMode === 'select'} onChange={() => setDirectCarMode('select')} className="accent-primary" /> Select Specific Cars
                </label>
              </div>

              <div className="flex gap-4 p-2 bg-surface rounded border border-border">
                <span className="text-xs text-muted font-bold py-1">Delivery Type:</span>
                <label className="flex items-center gap-1 text-xs text-muted cursor-pointer">
                  <input type="radio" checked={directCarDeliveryType === 'stock'} onChange={() => setDirectCarDeliveryType('stock')} className="accent-primary" /> Stock (Base)
                </label>
                <label className="flex items-center gap-1 text-xs text-muted cursor-pointer">
                  <input type="radio" checked={directCarDeliveryType === 'maxed'} onChange={() => setDirectCarDeliveryType('maxed')} className="accent-primary" /> Maxed Out
                </label>
              </div>
            </div>

            {directCarMode === 'select' && (
              <div className="flex flex-col gap-2 mt-2">
                <input
                  type="text"
                  placeholder="Search cars..."
                  value={directCarSearch}
                  onChange={(e) => setDirectCarSearch(e.target.value)}
                  className="w-full rounded-md border border-border bg-surface px-2 py-1 text-sm text-fg focus:border-primary focus:outline-none"
                />

                <div className="h-64 overflow-y-auto border border-border rounded-md bg-[#1a1a1a] p-2 flex flex-col gap-1">
                  {ALL_CAR_IDS
                    .filter(crdb => crdb.toLowerCase().includes(directCarSearch.toLowerCase()))
                    .map(crdb => (
                      <label key={crdb} className="flex items-center gap-2 w-full text-xs text-white hover:bg-gray-700 cursor-pointer p-1 rounded">
                        <input
                          type="checkbox"
                          checked={directSelectedCars.includes(crdb)}
                          onChange={(e) => {
                            if (e.target.checked) setDirectSelectedCars([...directSelectedCars, crdb]);
                            else setDirectSelectedCars(directSelectedCars.filter(id => id !== crdb));
                          }}
                          className="w-4 h-4 accent-primary shrink-0"
                        />
                        <span className="break-all">{crdb}</span>
                      </label>
                  ))}
                </div>
                <div className="text-xs text-muted text-right">{directSelectedCars.length} cars selected</div>
              </div>
            )}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4 border-t border-border pt-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-fg border-b border-border pb-2 text-purple-400">
            4. God Inbox
          </h3>
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted">Inject rewards directly into your in-game Inbox.</p>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={enableInbox} onChange={(e) => setEnableInbox(e.target.checked)} className="w-4 h-4 accent-purple-500" />
              <span className="text-sm font-bold text-fg">Enable Inbox Injection</span>
            </label>
          </div>

          {enableInbox && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-surface-2 p-4 rounded-lg border border-border">
              {Object.entries({
                cash: "Cash", gold: "Gold", bronzeKeys: "Bronze Keys", silverKeys: "Silver Keys",
                goldKeys: "Gold Keys", fuel: "Fuel Pips", eliteTokens: "Elite Tokens",
                carCredits: "Car Credits", wildcardTokens: "Wildcard Tokens", crewRP: "Crew RP",
                tickets: "Tickets", stickers: "Profile Stickers", banners: "Profile Banners",
                stage6: "Stage 6 Parts (Per Car) - Max 10", restorationParts: "Restoration Parts",
                jokerStage6: "Joker Stage 6 (Per Car) - Max 10", jokerRestoration: "Joker Restoration",
              }).map(([key, label]) => (
                <div key={key} className="flex flex-col gap-1">
                  <label className="text-xs text-muted">{label}</label>
                  <input
                    type="number"
                    value={inboxSettings[key as keyof typeof inboxSettings]}
                    onChange={(e) => setInboxSettings({...inboxSettings, [key]: parseInt(e.target.value) || 0})}
                    className="w-full rounded-md border border-border bg-surface px-2 py-1 text-sm text-fg focus:border-purple-500 focus:outline-none"
                  />
                </div>
              ))}

              <div className="col-span-2 md:col-span-4 border border-border rounded-md p-3 bg-surface mt-2">
                <label className="text-xs font-bold text-fg mb-2 block">Car Injection Mode</label>

                <div className="flex gap-4 mb-3">
                  <label className="flex items-center gap-1 text-xs text-muted cursor-pointer">
                    <input type="radio" checked={carMode === 'all'} onChange={() => setCarMode('all')} className="accent-purple-500" /> All Cars
                  </label>
                  <label className="flex items-center gap-1 text-xs text-muted cursor-pointer">
                    <input type="radio" checked={carMode === 'select'} onChange={() => setCarMode('select')} className="accent-purple-500" /> Select Specific Cars
                  </label>
                  <label className="flex items-center gap-1 text-xs text-muted cursor-pointer">
                    <input type="radio" checked={carMode === 'none'} onChange={() => setCarMode('none')} className="accent-purple-500" /> No Cars
                  </label>
                </div>

                {carMode !== 'none' && (
                  <div className="flex gap-4 mb-3 p-2 bg-surface-2 rounded border border-border">
                    <span className="text-xs text-muted font-bold py-1">Delivery Type:</span>
                    <label className="flex items-center gap-1 text-xs text-muted cursor-pointer">
                      <input type="radio" checked={carDeliveryType === 'stock'} onChange={() => setCarDeliveryType('stock')} className="accent-purple-500" /> Stock (Base)
                    </label>
                    <label className="flex items-center gap-1 text-xs text-muted cursor-pointer">
                      <input type="radio" checked={carDeliveryType === 'maxed'} onChange={() => setCarDeliveryType('maxed')} className="accent-purple-500" /> Maxed Out
                    </label>
                  </div>
                )}

                {carMode !== 'none' && (
                  <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-border">
                    <label className="flex items-center gap-2 cursor-pointer bg-surface-2 p-3 rounded border border-border">
                      <input
                        type="checkbox"
                        checked={injectAssociatedFusions}
                        onChange={(e) => setInjectAssociatedFusions(e.target.checked)}
                        className="w-4 h-4 accent-purple-500"
                      />
                      <span className="text-xs font-bold text-fg">
                        {carMode === 'all'
                          ? "Inject fusion parts for all brands (Warning: Heavy Lag)"
                          : "Inject fusion parts for selected car brands only"}
                      </span>
                    </label>
                  </div>
                )}

                {carMode === 'select' && (
                  <div className="flex flex-col gap-2 mt-3">
                    <input
                      type="text"
                      placeholder="Search cars..."
                      value={carSearch}
                      onChange={(e) => setCarSearch(e.target.value)}
                      className="w-full rounded-md border border-border bg-surface-2 px-2 py-1 text-sm text-fg focus:border-purple-500 focus:outline-none"
                    />

                    <div className="h-64 overflow-y-auto border border-border rounded-md bg-[#1a1a1a] p-2 flex flex-col gap-1">
                      {ALL_CAR_IDS
                        .filter(crdb => crdb.toLowerCase().includes(carSearch.toLowerCase()))
                        .map(crdb => (
                          <label key={crdb} className="flex items-center gap-2 w-full text-xs text-white hover:bg-gray-700 cursor-pointer p-1 rounded">
                            <input
                              type="checkbox"
                              checked={selectedCars.includes(crdb)}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedCars([...selectedCars, crdb]);
                                else setSelectedCars(selectedCars.filter(id => id !== crdb));
                              }}
                              className="w-4 h-4 accent-purple-500 shrink-0"
                            />
                            <span className="break-all">{crdb}</span>
                          </label>
                      ))}
                    </div>
                    <div className="text-xs text-muted text-right">{selectedCars.length} cars selected</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-2 border-t border-border pt-4">
        <button onClick={handleGenerate} disabled={isLoading} className="w-full rounded-md bg-primary px-3 py-3 text-sm font-bold text-primary-fg hover:bg-primary/90 disabled:opacity-50 transition">
          {isLoading ? "Processing..." : "Generate Files"}
        </button>
      </section>

      <div className="flex flex-col gap-2 text-center">
        {status && <p className="text-sm text-primary font-semibold">{status}</p>}
        {error && <p className="text-sm text-danger font-semibold">{error}</p>}
      </div>

      <details className="border-t border-border pt-4 mt-4 group">
        <summary className="text-lg font-bold text-fg cursor-pointer flex items-center justify-between hover:text-primary transition-colors list-none [&::-webkit-details-marker]:hidden">
          <span>5. How to Push (The True Maverick Method)</span>
          <span className="text-sm font-normal text-muted group-open:rotate-180 transition-transform">▼</span>
        </summary>
        <div className="flex flex-col gap-4 mt-4">
          <div className="flex flex-col gap-6 bg-surface-2 p-4 rounded-lg border border-border text-sm text-fg">
            <div>
              <h4 className="font-bold text-primary mb-1">Step 1: Download & Install the Game</h4>
              <p className="text-muted mb-2">
                Download from the google play if you're capable. Or get the fresh apk and obb from APKPure which is the one we recommend.
              </p>
              <p className="text-muted">
                Install the APK and place the OBB files in <code className="bg-surface px-1 rounded">/sdcard/Android/obb/com.naturalmotion.customstreetracer2/</code>. <strong className="text-red-400">Do NOT download pre-modded APKs or OBBs.</strong>
              </p>
            </div>

            <div>
              <h4 className="font-bold text-primary mb-1">Step 2: Setup a Fresh Account</h4>
              <p className="text-muted">
                Launch the game and log in with a fresh Google account. <strong>Crucial:</strong> Complete the tutorial completely until you are sitting in your garage with no forced popups. Once done, close the game completely.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-primary mb-1">Step 3: Pull Your Current Files</h4>
              <p className="text-muted mb-2 text-amber-500 font-bold">
                IMPORTANT WARNING FOR POWERSHELL: Do NOT paste the entire script block at once. PowerShell's multi-line paste protection can break the script and freeze the window. Paste the script ONE LINE AT A TIME, or save it as a .ps1 file and run it.
              </p>
              {platform === 'emulator' ? (
                <>
                  <p className="text-muted mb-2">
                    Use the script below to pull your original <code className="bg-surface px-1 rounded">nsb</code> and <code className="bg-surface px-1 rounded">scb</code> files from your emulator to your PC.
                  </p>
                  {renderScript("Pull Files Script", getPullScript(), true)}
                </>
              ) : (
                <>
                  <p className="text-muted mb-2">
                    Pick <strong>ONE</strong> method below. Both pull your original <code className="bg-surface px-1 rounded">nsb</code> and <code className="bg-surface px-1 rounded">scb</code> files.
                  </p>
                  <div className="flex flex-col gap-4">
                    <div>
                      <p className="text-xs text-muted mb-2">
                        <strong className="text-fg">Method A: Phone + PC.</strong> Enable Developer Options and USB Debugging, plug the phone in, run <code className="bg-surface px-1 rounded">adb devices</code>, and tap Allow on the phone. Make sure <code className="bg-surface px-1 rounded">adb</code> is in your PATH (or run from your <code className="bg-surface px-1 rounded">platform-tools</code> folder). Approve the root prompt if your root app asks. Files land in your PC's Downloads folder. Run in PowerShell.
                      </p>
                      {renderScript("Method A: PowerShell (Phone + PC)", phonePcPullScript, true)}
                    </div>
                    <div>
                      <p className="text-xs text-muted mb-2">
                        <strong className="text-fg">Method B: Phone only (no PC).</strong> Open Termux, run <code className="bg-surface px-1 rounded">termux-setup-storage</code> once if you haven't, and grant root when prompted. Files land in your phone's <code className="bg-surface px-1 rounded">/sdcard/Download/</code> folder.
                      </p>
                      {renderScript("Method B: Bash (On-Device / Termux)", phoneTermuxPullScript, true)}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div>
              <h4 className="font-bold text-primary mb-1">Step 4: Upload and Generate</h4>
              <p className="text-muted">
                Upload the <code className="bg-surface px-1 rounded">nsb_original</code> and <code className="bg-surface px-1 rounded">scb_original</code> files (from your Downloads folder) to this tool. Enter your Player ID (found in the game settings). Select your cars and resources, click Generate, and save the <code className="bg-surface px-1 rounded">nsb_modded</code> and <code className="bg-surface px-1 rounded">scb_modded</code> files to your Downloads folder.
              </p>
              {platform === 'phone' && (
                <p className="text-xs text-muted mt-2">
                  Using Method B? Do this step in your phone's browser so the files download straight to <code className="bg-surface px-1 rounded">/sdcard/Download/</code>.
                </p>
              )}
            </div>

            <div>
              <h4 className="font-bold text-primary mb-1">Step 5: Run the Injection Script</h4>
              {platform === 'emulator' ? (
                <>
                  <p className="text-muted mb-2">
                    Select your emulator from the dropdown below, then click "Copy Script". Open PowerShell, paste the script (line by line), and press Enter. The script will automatically enable root, force stop the game, clear app data, inject your files, and launch the game.
                  </p>
                  <div className="flex flex-col gap-2 mt-2">
                    <span className="text-sm font-bold text-fg">Select Your Emulator</span>
                    <select
                      value={emulator}
                      onChange={(e) => setEmulator(e.target.value as any)}
                      className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm text-fg focus:outline-none focus:border-primary mb-2"
                    >
                      <option value="gpgde">Google Play Games Developer Emulator</option>
                      <option value="ldplayer">LDPlayer</option>
                      <option value="bluestacks">BlueStacks 5</option>
                      <option value="mumu">MuMu Player 12</option>
                    </select>
                  </div>
                  {renderScript("PowerShell Script", getInjectScript())}
                </>
              ) : (
                <>
                  <p className="text-muted mb-2">
                    Use the <strong>same method</strong> you used in Step 3. The script will force stop the game, clear app data, inject your modded files, and launch the game automatically.
                  </p>
                  <div className="flex flex-col gap-4">
                    <div>
                      <p className="text-xs text-muted mb-2">
                        <strong className="text-fg">Method A: Phone + PC.</strong> Make sure <code className="bg-surface px-1 rounded">nsb_modded</code> and <code className="bg-surface px-1 rounded">scb_modded</code> are in your PC's Downloads folder, then run in PowerShell with the phone plugged in.
                      </p>
                      {renderScript("Method A: PowerShell (Phone + PC)", phonePcInjectScript)}
                    </div>
                    <div>
                      <p className="text-xs text-muted mb-2">
                        <strong className="text-fg">Method B: Phone only (no PC).</strong> Make sure <code className="bg-surface px-1 rounded">nsb_modded</code> and <code className="bg-surface px-1 rounded">scb_modded</code> are in your phone's <code className="bg-surface px-1 rounded">/sdcard/Download/</code> folder, then paste into Termux.
                      </p>
                      {renderScript("Method B: Bash (On-Device / Termux)", phoneTermuxInjectScript)}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div>
              <h4 className="font-bold text-primary mb-1">Step 6: Choose Local</h4>
              <p className="text-muted">
                When the game launches, it will prompt you to restore a cloud save or use the local save. Click the <strong>LEFT (Local)</strong> option.
              </p>
            </div>
          </div>
        </div>
      </details>
    </div>
  );
}