const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

exports.main = async (event, context) => {
  try {
    const { title } = event
    
    const templates = [
      `杩欎釜${title}鎵胯浇鐫€鎴戠殑娓╂殩鍥炲繂锛屽笇鏈涘畠鑳藉甫缁欎綘鍚屾牱鐨勫揩涔愩€傜敓娲诲氨鍍忕洸鐩掞紝鍏呮弧鎯婂枩鍜屾湡寰呫€俙,
      `姣忎竴涓墿鍝侀兘鏈夊畠鐨勬晠浜嬶紝杩欎釜${title}鏇剧粡闄即鎴戝害杩囦竴娈电編濂界殑鏃跺厜锛岀幇鍦ㄥ畠灏嗗紑濮嬫柊鐨勬梾绋嬨€俙,
      `鍦ㄦ鐢熼櫌鐨勬棩瀛愰噷锛岃繖涓?{title}缁欐垜甯︽潵浜嗗緢澶氫究鍒╁拰蹇箰锛屽笇鏈涘畠涔熻兘涓轰綘澧炴坊涓€浠芥俯鏆栥€俙,
      `绮惧績鎸戦€夌殑${title}锛屽笇鏈涘畠鑳芥垚涓轰綘鐢熸椿涓殑灏忕‘骞革紝璁╂瘡涓€澶╅兘鍏呮弧闃冲厜銆俙,
      `杩欎釜${title}铏界劧涓嶆槸鍏ㄦ柊鐨勶紝浣嗗畠鎵胯浇鐫€鎴戠殑蹇冩剰锛屽笇鏈涗綘鑳藉枩娆㈠畠锛岃瀹冪户缁彂鎸ヤ环鍊笺€俙
    ]
    
    const randomIndex = Math.floor(Math.random() * templates.length)
    const note = templates[randomIndex]
    
    return {
      note
    }
  } catch (error) {
    console.error('鐢熸垚绾告潯澶辫触', error)
    return {
      note: '甯屾湜杩欎釜鐗╁搧鑳界粰浣犲甫鏉ュ揩涔愬拰娓╂殩锛岃鎴戜滑涓€璧蜂紶閫掑杽鎰忋€?
    }
  }
}
