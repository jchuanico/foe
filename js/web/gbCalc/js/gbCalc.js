{

    let GBList = {};
    const goldenGBs = ['X_AllAge_EasterBonus4','X_BronzeAge_Landmark2','X_IronAge_Landmark1','X_EarlyMiddleAge_Landmark2','X_HighMiddleAge_Landmark1','X_LateMiddleAge_Landmark3','X_ColonialAge_Landmark2','X_IndustrialAge_Landmark1','X_ProgressiveEra_Landmark1','X_ProgressiveEra_Landmark2','X_ContemporaryEra_Landmark1','X_FutureEra_Landmark1','X_ArcticFuture_Landmark2','X_ArcticFuture_Landmark3','X_OceanicFuture_Landmark2','X_OceanicFuture_Landmark3','X_VirtualFuture_Landmark1','X_VirtualFuture_Landmark2','X_SpaceAgeMars_Landmark2','X_SpaceAgeAsteroidBelt_Landmark1','X_StellarAgeDiscovery_Landmark1'];

    // other player's city loaded
    FH.proxy.addHandler('OtherPlayerService', 'visitPlayer', (data, postData) => {
		let GBs  = data.responseData.city_map.entities.filter(x=>x.type=="greatbuilding");
        GBList = Object.assign(GBList, ...GBs.map(x => ({[x.player_id+ '_' + x.id]:x})));
	});
    // own city loaded
    FH.proxy.addHandler('CityMapService', 'getEntities', (data, postData) => {
		let GBs  = data.responseData.filter(x=>x.type=="greatbuilding");
        GBList = Object.assign(GBList, ...GBs.map(x => ({[x.player_id+ '_' + x.id]:x})));
	});
    FH.proxy.addHandler('StartupService', 'getData', (data, postData) => {
		let GBs  = data.responseData.city_map.entities.filter(x=>x.type=="greatbuilding");
        GBList = Object.assign(GBList, ...GBs.map(x => ({[x.player_id+ '_' + x.id]:x})));
	});
    FH.proxy.addHandler('CityMapService', 'updateEntity', (data, postData) => {
		let GBs  = data.responseData.filter(x=>x.type=="greatbuilding");
        GBList = Object.assign(GBList, ...GBs.map(x => ({[x.player_id+ '_' + x.id]:x})));
	});
    //own GB leveled up by other player while opened
    FH.proxy.addWsHandler('CityMapService', 'updateEntity', data => {
        let GBs  = data.responseData.filter(x=>x.type=="greatbuilding");
        GBList = Object.assign(GBList, ...GBs.map(x => ({[x.player_id+ '_' + x.id]:x})));
    });
    // any player GB opened
    FH.proxy.addHandler('OtherPlayerService', 'getOtherPlayerCityMapEntity', (data, postData) => {
		let x = data.responseData;
        if (x.type!="greatbuilding") return;
        GBList[x.player_id+ '_' + x.id] = x;
	});
    // any player GB list loaded
    FH.proxy.addHandler('GreatBuildingsService', 'getOtherPlayerOverview', (data, postData) => {
		data.responseData.forEach(x=>{
            let id= x.player.player_id + '_' + x.entity_id;
            if (GBList[id]) {
                GBList[id].state.invested_forge_points = x.current_progress;
                GBList[id].state.forge_points_for_level_up = x.max_progress;
                GBList[id].level = x.level;
                GBList[id].max_level = x.maxLevel || GBList[id].max_level;
            }
        })
	});
   // FP payed into (own) GB
    FH.proxy.addHandler('CityMapService', 'reset', (data, postData) => {
		let x = data.responseData[0];
        if (x.type!="greatbuilding") return;
        GBList[x.player_id+ '_' + x.id] = x;
	});

    /**
     * Golden tier: listed GB above level 101.
     * hasBonuses is only checked when known (full city entity); contribution rows don't carry it.
     */
    function isGolden(cityentity_id, level, hasBonuses = true) {
        return goldenGBs.indexOf(cityentity_id) >= 0 && level > 101 && hasBonuses;
    };

    function setGBtier(gb) {
        if (!gb) return;
        gb.tier = isGolden(gb.cityentity_id, gb.level, (gb.bonuses?.length || 0) > 0) ? 'gold' : 'copper';
        // FH.Main.ArkBonus stays the copper (normal) bonus for all other modules.
        // Tier-aware code uses getArcBoost() instead of switching the global.
    };

    function getGB(player_id, entity_id) {
        let id = player_id + '_' + entity_id;
        setGBtier(GBList[id]);
        return GBList[id];
    };

    /**
     * The player's own contribution bonus that applies to rewards from a GB of this tier
     */
    function getArcBoost(tier) {
        return tier === 'gold' ? (Boosts.Sums.contribution_boost_gold || 0) : (Boosts.Sums.contribution_boost || 0);
    };

    FH.GBCalc = {getGB: getGB, isGolden: isGolden, getArcBoost: getArcBoost};

}
