//具体的打包配置
var allGameConfig = require('../assets/resources/script/all_game_config');

var bundle_list = {};

bundle_list[allGameConfig["9999"]]=[
    "resources",
    "internal",
    "main"
];

bundle_list[allGameConfig["0"]]=[
    "lobby",
    "game_com",
    "com_snd"
];

// bundle_list[allGameConfig["1"]]=[
//     "1_test_res",
//     "1_test_snd",
// ];

bundle_list[allGameConfig["2"]]=[
    "2_hzmj_res",
    "2_hzmj_snd",
];

module.exports = bundle_list;